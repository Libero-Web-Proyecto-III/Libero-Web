import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { CommentEntity } from 'src/modules/comment/entities/comment.entity';
import { PublicationEntity } from 'src/modules/publication/entities/publication.entity';
import { ReactionType } from '../enum/reactionType.enum';

// Una reacción apunta EXACTAMENTE a un comentario O a una publicación
// (nunca a los dos, eso lo valida el servicio antes de guardar).
//
// Las dos restricciones @Unique de abajo son las que garantizan, a nivel
// de base de datos, que un mismo usuario no pueda tener like y dislike
// al mismo tiempo ni en el mismo comentario ni en la misma publicación.
@Entity('reaction')
@Unique('uq_reaction_author_comment', ['comment', 'author'])
@Unique('uq_reaction_author_publication', ['publication', 'author'])
export class ReactionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // Un mismo usuario SÍ puede reaccionar a muchos comentarios y
  // publicaciones distintas; la restricción es por la combinación
  // (comment, author) o (publication, author), no por author solo.
  //
  // @JoinColumn con referencedColumnName: 'index' deja una sola columna
  // FK (authorIndex) en vez de las 2 que TypeORM crearía por defecto,
  // porque UserEntity tiene llave compuesta (index + uuid).
  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'authorIndex', referencedColumnName: 'index' })
  author: UserEntity;

  // Reacción sobre un COMENTARIO. Nula si la reacción es a una publicación.
  // CommentEntity ya tiene llave primaria simple (index), así que aquí
  // TypeORM crea una sola columna FK (commentIndex) sin necesidad de
  // @JoinColumn explícito, pero lo dejamos igual para que sea explícito.
  @ManyToOne(() => CommentEntity, (comment) => comment.reactions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'commentIndex', referencedColumnName: 'index' })
  comment: CommentEntity | null;

  // Reacción sobre una PUBLICACIÓN. Nula si la reacción es a un comentario.
  // Igual que con author: una sola columna FK (publicationIndex) en vez
  // de dos, porque PublicationEntity también tiene llave compuesta.
  @ManyToOne(() => PublicationEntity, (publication) => publication.reactions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'publicationIndex', referencedColumnName: 'index' })
  publication: PublicationEntity | null;

  @Column({ type: 'enum', enum: ReactionType })
  type: ReactionType;

  @CreateDateColumn({ type: 'timestamp', name: 'createdAt' })
  createdAt: Date;
}
