import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Generated,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
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
  @PrimaryGeneratedColumn()
  index: number;

  @PrimaryColumn()
  @Generated('uuid')
  uuid: string;

  // Autor del comentario. Un mismo usuario puede tener muchos comentarios,
  // por eso NO hay ninguna restricción de unicidad aquí (a propósito).
  @ManyToOne(() => UserEntity, { eager: false })
  author: UserEntity;

  // Relación inversa a la que ya existía en PublicationEntity:
  // @OneToMany(() => CommentEntity, (comment) => comment.publication)
  @ManyToOne(() => PublicationEntity, (publication) => publication.comments, {
    onDelete: 'CASCADE',
  })
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
