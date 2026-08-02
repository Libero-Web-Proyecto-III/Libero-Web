import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReactionEntity } from './entities/reaction.entity';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { ReactionType } from './enum/reactionType.enum';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { CommentEntity } from 'src/modules/comment/entities/comment.entity';
import { PublicationEntity } from 'src/modules/publication/entities/publication.entity';

export interface ReactionSummary {
  likes: number;
  dislikes: number;
  userReaction: ReactionType | null;
}

export interface ReactResult {
  action: 'created' | 'updated' | 'removed';
  reaction: ReactionEntity | null;
}

@Injectable()
export class ReactionService {
  constructor(
    @InjectRepository(ReactionEntity)
    private readonly reactionRepository: Repository<ReactionEntity>,
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    @InjectRepository(PublicationEntity)
    private readonly publicationRepository: Repository<PublicationEntity>,
  ) {}

  /**
   * Lógica central del módulo (toggle), válida tanto para reaccionar a un
   * COMENTARIO como a una PUBLICACIÓN (se manda uno solo de los dos uuid).
   *
   * Un usuario solo puede tener UNA reacción por comentario/publicación,
   * nunca like y dislike al mismo tiempo sobre el mismo elemento:
   *   - No existe reacción todavía        -> se crea.
   *   - Ya existe con el MISMO tipo        -> se elimina (quitar el like/dislike).
   *   - Ya existe con tipo DISTINTO        -> se actualiza al nuevo tipo.
   */
  async react(dto: CreateReactionDto, author: UserEntity): Promise<ReactResult> {
    if (dto.commentUuid && dto.publicationUuid) {
      throw new BadRequestException('Solo puedes reaccionar a un comentario O a una publicación, no a ambos');
    }
    if (!dto.commentUuid && !dto.publicationUuid) {
      throw new BadRequestException('Debes indicar commentUuid o publicationUuid');
    }

    if (dto.commentUuid) {
      return this.reactToComment(dto.commentUuid, dto.type, author);
    }
    return this.reactToPublication(dto.publicationUuid as string, dto.type, author);
  }

  private async reactToComment(commentUuid: string, type: ReactionType, author: UserEntity): Promise<ReactResult> {
    const comment = await this.commentRepository.findOne({ where: { uuid: commentUuid } });
    if (!comment) throw new NotFoundException('No se encontró el comentario a reaccionar');

    const existing = await this.reactionRepository.findOne({
      where: { comment: { uuid: commentUuid }, author: { uuid: author.uuid } },
      relations: { comment: true, author: true },
    });

    return this.applyToggle(existing, type, { comment, publication: null, author });
  }

  private async reactToPublication(publicationUuid: string, type: ReactionType, author: UserEntity): Promise<ReactResult> {
    const publication = await this.publicationRepository.findOne({ where: { uuid: publicationUuid } });
    if (!publication) throw new NotFoundException('No se encontró la publicación a reaccionar');

    const existing = await this.reactionRepository.findOne({
      where: { publication: { uuid: publicationUuid }, author: { uuid: author.uuid } },
      relations: { publication: true, author: true },
    });

    return this.applyToggle(existing, type, { comment: null, publication, author });
  }

  private async applyToggle(
    existing: ReactionEntity | null,
    type: ReactionType,
    base: { comment: CommentEntity | null; publication: PublicationEntity | null; author: UserEntity },
  ): Promise<ReactResult> {
    if (!existing) {
      const reaction = this.reactionRepository.create({ ...base, type });
      const saved = await this.reactionRepository.save(reaction);
      return { action: 'created', reaction: saved };
    }

    if (existing.type === type) {
      await this.reactionRepository.remove(existing);
      return { action: 'removed', reaction: null };
    }

    existing.type = type;
    const updated = await this.reactionRepository.save(existing);
    return { action: 'updated', reaction: updated };
  }

  async getCommentSummary(commentUuid: string, requesterUuid?: string): Promise<ReactionSummary> {
    const [likes, dislikes] = await Promise.all([
      this.reactionRepository.count({ where: { comment: { uuid: commentUuid }, type: ReactionType.LIKE } }),
      this.reactionRepository.count({ where: { comment: { uuid: commentUuid }, type: ReactionType.DISLIKE } }),
    ]);

    let userReaction: ReactionType | null = null;
    if (requesterUuid) {
      const own = await this.reactionRepository.findOne({
        where: { comment: { uuid: commentUuid }, author: { uuid: requesterUuid } },
      });
      userReaction = own ? own.type : null;
    }

    return { likes, dislikes, userReaction };
  }

  async getPublicationSummary(publicationUuid: string, requesterUuid?: string): Promise<ReactionSummary> {
    const [likes, dislikes] = await Promise.all([
      this.reactionRepository.count({ where: { publication: { uuid: publicationUuid }, type: ReactionType.LIKE } }),
      this.reactionRepository.count({ where: { publication: { uuid: publicationUuid }, type: ReactionType.DISLIKE } }),
    ]);

    let userReaction: ReactionType | null = null;
    if (requesterUuid) {
      const own = await this.reactionRepository.findOne({
        where: { publication: { uuid: publicationUuid }, author: { uuid: requesterUuid } },
      });
      userReaction = own ? own.type : null;
    }

    return { likes, dislikes, userReaction };
  }
}
