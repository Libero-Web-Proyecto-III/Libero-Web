import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({ description: 'Llave primaria interna de la reacción', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  // Un mismo usuario SÍ puede reaccionar a muchos comentarios y
  // publicaciones distintas; la restricción es por la combinación
  // (comment, author) o (publication, author), no por author solo.
  //
  // @JoinColumn con referencedColumnName: 'index' deja una sola columna
  // FK (authorIndex) en vez de las 2 que TypeORM crearía por defecto,
  // porque UserEntity tiene llave compuesta (index + uuid).
  @ApiProperty({ description: 'Usuario que realizó la reacción', type: () => UserEntity })
  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'authorIndex', referencedColumnName: 'index' })
  author: UserEntity;

  // Reacción sobre un COMENTARIO. Nula si la reacción es a una publicación.
  // CommentEntity ya tiene llave primaria simple (index), así que aquí
  // TypeORM crea una sola columna FK (commentIndex) sin necesidad de
  // @JoinColumn explícito, pero lo dejamos igual para que sea explícito.
  @ApiProperty({
    description: 'Comentario al que pertenece la reacción. Null si la reacción es sobre una publicación',
    type: () => CommentEntity,
    nullable: true,
  })
  @ManyToOne(() => CommentEntity, (comment) => comment.reactions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'commentIndex', referencedColumnName: 'index' })
  comment: CommentEntity | null;

  // Reacción sobre una PUBLICACIÓN. Nula si la reacción es a un comentario.
  // Igual que con author: una sola columna FK (publicationIndex) en vez
  // de dos, porque PublicationEntity también tiene llave compuesta.
  @ApiProperty({
    description: 'Publicación a la que pertenece la reacción. Null si la reacción es sobre un comentario',
    type: () => PublicationEntity,
    nullable: true,
  })
  @ManyToOne(() => PublicationEntity, (publication) => publication.reactions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'publicationIndex', referencedColumnName: 'index' })
  publication: PublicationEntity | null;

  @ApiProperty({ description: 'Tipo de reacción', enum: ReactionType, example: ReactionType.LIKE })
  @Column({ type: 'enum', enum: ReactionType })
  type: ReactionType;

  @ApiProperty({ description: 'Fecha de creación de la reacción', example: '2026-08-08T10:00:00.000Z' })
  @CreateDateColumn({ type: 'timestamp', name: 'createdAt' })
  createdAt: Date;
}
