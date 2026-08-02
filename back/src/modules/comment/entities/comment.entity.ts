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
import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { PublicationEntity } from 'src/modules/publication/entities/publication.entity';
import { ReactionEntity } from 'src/modules/reaction/entities/reaction.entity';

@Entity('comment')
export class CommentEntity {
  // Única llave primaria de la tabla.
  @PrimaryGeneratedColumn()
  index: number;

  // Identificador público (el que se usa en las URLs), solo una columna
  // única normal, no forma parte de la llave primaria.
  @Column({ unique: true })
  @Generated('uuid')
  uuid: string;

  // Autor del comentario. Un mismo usuario puede tener muchos comentarios,
  // por eso NO hay ninguna restricción de unicidad aquí (a propósito).
  //
  // @JoinColumn con referencedColumnName: 'index' hace que solo se cree
  // UNA columna de llave foránea (authorIndex), en vez de las 2 que
  // TypeORM crea por defecto cuando el destino tiene llave compuesta.
  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'authorIndex', referencedColumnName: 'index' })
  author: UserEntity;

  // Misma idea: una sola columna FK (publicationIndex) en vez de dos.
  @ManyToOne(() => PublicationEntity, (publication) => publication.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'publicationIndex', referencedColumnName: 'index' })
  publication: PublicationEntity;

  @Column('text')
  content: string;

  @ApiHideProperty()
  @Exclude()
  @OneToMany(() => ReactionEntity, (reaction) => reaction.comment)
  reactions: ReactionEntity[];

  @CreateDateColumn({ type: 'timestamp', name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', name: 'deletedAt' })
  deletedAt: Date;
}
