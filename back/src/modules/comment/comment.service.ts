import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentEntity } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { GetCommentQueryDto } from './dto/get-comment-query.dto';
import { AllResponse } from 'src/common/interface/res-all.dto';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { PublicationEntity } from 'src/modules/publication/entities/publication.entity';
import { enumRol } from 'src/common/enums/rol.enum';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    @InjectRepository(PublicationEntity)
    private readonly publicationRepository: Repository<PublicationEntity>,
    private readonly notificationService: NotificationService,
  ) {}

  // Un mismo usuario puede llamar esto varias veces sobre la misma
  // publicación: no hay ninguna restricción de unicidad, cada llamada
  // crea un comentario nuevo.
  async create(dto: CreateCommentDto, author: UserEntity & { id?: number }): Promise<CommentEntity> {
    const publication = await this.publicationRepository.findOne({
      where: { uuid: dto.publicationUuid },
    });
    if (!publication) {
      throw new NotFoundException('No se encontró la publicación a comentar');
    }

    const authorIndex = author.index ?? author.id;
    if (!authorIndex) {
      throw new ForbiddenException('No se pudo identificar al autor del comentario');
    }

    const comment = this.commentRepository.create({
      content: dto.content,
      publication,
      author: { index: authorIndex } as UserEntity,
    });
    const saved = await this.commentRepository.save(comment);

    const reloaded = await this.commentRepository.findOne({
      where: { index: saved.index },
      relations: { author: { rol: true, tag: true, tags: true }, publication: true },
    });

    return reloaded ?? saved;
  }

  async findAll(query: GetCommentQueryDto): Promise<AllResponse> {
    const { page = 1, limit = 10, publicationUuid } = query;
    const skip = (page - 1) * (limit ?? 10);

    const [data, total] = await this.commentRepository.findAndCount({
      where: publicationUuid ? { publication: { uuid: publicationUuid } } : {},
      relations: { author: { rol: true, tag: true, tags: true }, publication: true },
      skip,
      take: limit ?? 10,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      meta: {
        totalItems: total,
        itemCount: data.length,
        itemsPerPage: limit ?? 10,
        totalPages: Math.ceil(total / (limit ?? 10)),
        currentPage: page ?? 1,
      },
    };
  }

  findOneBy = {
    uuid: async (uuid: string): Promise<CommentEntity> => {
      const comment = await this.commentRepository.findOne({
        where: { uuid },
        relations: { author: { rol: true, tag: true, tags: true }, publication: true },
      });
      if (!comment) throw new NotFoundException('No se encontró este comentario');
      return comment;
    },
  };

  async update(uuid: string, dto: UpdateCommentDto, requester: UserEntity & { id?: number; role?: string }): Promise<CommentEntity> {
    const comment = await this.findOneBy.uuid(uuid);
    const requesterId = Number(requester.index ?? requester.id);
    const roleNormalized = (requester.role || '').toLowerCase().trim();
    if (roleNormalized !== enumRol.ADMIN && comment.author?.index !== requesterId) {
      throw new ForbiddenException('Solo un administrador o el autor puede editar comentarios');
    }
    return this.commentRepository.save({ index: comment.index, ...dto });
  }

  async remove(
    uuid: string,
    requester: UserEntity & { id?: number; role?: string },
    reason?: string,
  ) {
    const comment = await this.findOneBy.uuid(uuid);
    const requesterId = Number(requester.index ?? requester.id);
    const requesterRole = String(requester.role || '').toLowerCase().trim();
    const isModeratorOrAdmin =
      requesterRole === enumRol.ADMIN ||
      requesterRole === enumRol.MOD ||
      requesterRole === 'administrador' ||
      requesterRole === 'moderador';

    const authorIndex = Number(comment.author?.index);

    if (!isModeratorOrAdmin && authorIndex !== requesterId) {
      throw new ForbiddenException('No puedes eliminar un comentario que no es tuyo');
    }

    // Si la eliminación la hace un moderador o admin sobre el comentario de OTRO usuario,
    // se genera la notificación con el motivo indicado.
    // Si el usuario elimina su propio comentario (authorIndex === requesterId), no se genera notificación.
    if (isModeratorOrAdmin && authorIndex && authorIndex !== requesterId) {
      const finalReason = reason?.trim() || 'Incumplimiento de las normas comunitarias';
      try {
        await this.notificationService.createCommentModerationNotification({
          userIndex: authorIndex,
          moderatorIndex: requesterId,
          commentContent: comment.content,
          moderationReason: finalReason,
          publicationTitle: comment.publication?.title,
          publicationUuid: comment.publication?.uuid,
        });
      } catch (err) {
        console.error('Error al generar notificación de moderación:', err);
      }
    }

    return {
      message: 'Comentario ELIMINADO',
      comment: await this.commentRepository.softRemove(comment),
    };
  }
}

