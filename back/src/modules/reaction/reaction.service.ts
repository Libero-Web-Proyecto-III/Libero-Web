import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReactionEntity } from './entities/reaction.entity';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { ReactionType } from './enum/reactionType.enum';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { CommentEntity } from 'src/modules/comment/entities/comment.entity';

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
  ) {}

  /**
   * Lógica central del módulo (toggle):
   * Un usuario solo puede tener UNA reacción por comentario, nunca like
   * y dislike al mismo tiempo.
   *
   *   - No existe reacción todavía        -> se crea.
   *   - Ya existe con el MISMO tipo        -> se elimina (quitar el like/dislike).
   *   - Ya existe con tipo DISTINTO        -> se actualiza al nuevo tipo
   *                                          (pasar de like a dislike o viceversa).
   */
  async react(dto: CreateReactionDto, author: UserEntity): Promise<ReactResult> {
    const comment = await this.commentRepository.findOne({ where: { uuid: dto.commentUuid } });
    if (!comment) {
      throw new NotFoundException('No se encontró el comentario a reaccionar');
    }

    const existing = await this.reactionRepository.findOne({
      where: { comment: { uuid: dto.commentUuid }, author: { uuid: author.uuid } },
      relations: { comment: true, author: true },
    });

    if (!existing) {
      const reaction = this.reactionRepository.create({ comment, author, type: dto.type });
      const saved = await this.reactionRepository.save(reaction);
      return { action: 'created', reaction: saved };
    }

    if (existing.type === dto.type) {
      await this.reactionRepository.remove(existing);
      return { action: 'removed', reaction: null };
    }

    existing.type = dto.type;
    const updated = await this.reactionRepository.save(existing);
    return { action: 'updated', reaction: updated };
  }

  async getSummary(commentUuid: string, requesterUuid?: string): Promise<ReactionSummary> {
    const [likes, dislikes] = await Promise.all([
      this.reactionRepository.count({
        where: { comment: { uuid: commentUuid }, type: ReactionType.LIKE },
      }),
      this.reactionRepository.count({
        where: { comment: { uuid: commentUuid }, type: ReactionType.DISLIKE },
      }),
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
}
