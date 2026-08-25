import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { PublicationEntity } from 'src/modules/publication/entities/publication.entity';
import { ReactionEntity } from 'src/modules/reaction/entities/reaction.entity';

@Entity('comment')
export class CommentEntity {
  // Única llave primaria de la tabla.
  @ApiProperty({ description: 'Llave primaria interna (uso solo interno, no se expone en URLs)', example: 1 })
  @PrimaryGeneratedColumn()
  index: number;

  // Identificador público (el que se usa en las URLs), solo una columna
  // única normal, no forma parte de la llave primaria.
  @ApiProperty({
    description: 'Identificador público del comentario, usado en las URLs',
    example: 'a1b2c3d4-e5f6-4789-a012-3456789abcde',
  })
  @Column({ unique: true })
  @Generated('uuid')
  uuid: string;

  // Autor del comentario. Un mismo usuario puede tener muchos comentarios,
  // por eso NO hay ninguna restricción de unicidad aquí (a propósito).
  //
  // @JoinColumn con referencedColumnName: 'index' hace que solo se cree
  // UNA columna de llave foránea (authorIndex), en vez de las 2 que
  // TypeORM crea por defecto cuando el destino tiene llave compuesta.
  @ApiProperty({ description: 'Usuario autor del comentario', type: () => UserEntity })
  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'authorIndex', referencedColumnName: 'index' })
  author: UserEntity;

  // Misma idea: una sola columna FK (publicationIndex) en vez de dos.
  @ApiProperty({ description: 'Publicación a la que pertenece este comentario', type: () => PublicationEntity })
  @ManyToOne(() => PublicationEntity, (publication) => publication.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'publicationIndex', referencedColumnName: 'index' })
  publication: PublicationEntity;

  @ApiProperty({ description: 'Contenido del comentario', example: 'Muy buen post!' })
  @Column('text')
  content: string;

  @ApiHideProperty()
  @Exclude()
  @OneToMany(() => ReactionEntity, (reaction) => reaction.comment)
  reactions: ReactionEntity[];

  @ApiProperty({ description: 'Fecha de creación del comentario', example: '2026-08-08T10:00:00.000Z' })
  @CreateDateColumn({ type: 'timestamp', name: 'createdAt' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de última actualización del comentario', example: '2026-08-08T10:15:00.000Z' })
  @UpdateDateColumn({ type: 'timestamp', name: 'updatedAt' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Fecha de eliminación lógica (soft delete). Null si el comentario está activo',
    example: null,
    nullable: true,
  })
  @DeleteDateColumn({ type: 'timestamp', name: 'deletedAt' })
  deletedAt: Date;
}
