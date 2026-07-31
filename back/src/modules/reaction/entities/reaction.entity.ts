import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { CommentEntity } from 'src/modules/comment/entities/comment.entity';
import { PublicationEntity } from 'src/modules/publication/entities/publication.entity';
import { ReactionType } from '../enum/reactionType.enum';

// La combinación (comment, author) es única: un usuario solo puede tener
// UNA reacción por comentario (like O dislike, nunca las dos a la vez).
// Esto lo refuerza también el servicio (ver reaction.service.ts), pero
// se deja aquí como respaldo a nivel de base de datos.
@Entity('reaction')
@Unique('uq_reaction_author_comment', ['comment', 'author'])
export class ReactionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // Un mismo usuario SÍ puede reaccionar a muchos comentarios distintos;
  // la restricción de arriba es por la combinación (comment, author).
  @ManyToOne(() => UserEntity, { eager: false })
  author: UserEntity;

  // Reacción sobre un COMENTARIO (lo pedido: like/dislike a comentarios).
  @ManyToOne(() => CommentEntity, (comment) => comment.reactions, {
    onDelete: 'CASCADE',
  })
  comment: CommentEntity;

  // PublicationEntity ya declaraba `reactions: ReactionEntity[]` vía
  // `@OneToMany(() => ReactionEntity, (reaction) => reaction.publication)`.
  // Se deja aquí, nullable y SIN usar por este módulo, únicamente para no
  // romper esa relación existente en publication.entity.ts. Si en el futuro
  // quieren reacciones directas a publicaciones, ya queda la columna lista.
  @ManyToOne(() => PublicationEntity, (publication) => publication.reactions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  publication: PublicationEntity | null;

  @Column({ type: 'enum', enum: ReactionType })
  type: ReactionType;

  @CreateDateColumn({ type: 'timestamp', name: 'createdAt' })
  createdAt: Date;
}
