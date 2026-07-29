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

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    @InjectRepository(PublicationEntity)
    private readonly publicationRepository: Repository<PublicationEntity>,
  ) {}

  // Un mismo usuario puede llamar esto varias veces sobre la misma
  // publicación: no hay ninguna restricción de unicidad, cada llamada
  // crea un comentario nuevo.
  async create(dto: CreateCommentDto, author: UserEntity): Promise<CommentEntity> {
    const publication = await this.publicationRepository.findOne({
      where: { uuid: dto.publicationUuid },
    });
    if (!publication) {
      throw new NotFoundException('No se encontró la publicación a comentar');
    }

    const comment = this.commentRepository.create({
      content: dto.content,
      publication,
      author,
    });
    return this.commentRepository.save(comment);
  }

  async findAll(query: GetCommentQueryDto): Promise<AllResponse> {
    const { page = 1, limit = 10, publicationUuid } = query;
    const skip = (page - 1) * (limit ?? 10);

    const [data, total] = await this.commentRepository.findAndCount({
      where: publicationUuid ? { publication: { uuid: publicationUuid } } : {},
      relations: { author: true, publication: true },
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
        relations: { author: true, publication: true },
      });
      if (!comment) throw new NotFoundException('No se encontró este comentario');
      return comment;
    },
  };

  async update(uuid: string, dto: UpdateCommentDto, requester: UserEntity): Promise<CommentEntity> {
    const comment = await this.findOneBy.uuid(uuid);
    if (comment.author.uuid !== requester.uuid) {
      throw new ForbiddenException('No puedes editar un comentario que no es tuyo');
    }
    return this.commentRepository.save({ index: comment.index, ...dto });
  }

  async remove(uuid: string, requester: UserEntity) {
    const comment = await this.findOneBy.uuid(uuid);
    if (comment.author.uuid !== requester.uuid) {
      throw new ForbiddenException('No puedes eliminar un comentario que no es tuyo');
    }
    return {
      message: 'Comentario ELIMINADO',
      comment: await this.commentRepository.softRemove(comment),
    };
  }
}
