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
import { CommentEntity } from 'src/modules/comment/entities/comment.entity';
import { ReactionEntity } from 'src/modules/reaction/entities/reaction.entity';

@Entity('publication')
export class PublicationEntity {
  @PrimaryGeneratedColumn()
  index: number;

  @PrimaryColumn()
  @Generated('uuid')
  uuid: string;

  @ManyToOne(() => UserEntity, (user) => user.publications)
  author: UserEntity;

  @Column()
  title: string;

  @Column('simple-array', { nullable: true })
  media: string[];

  @Column('text')
  content: string;

  @ApiHideProperty()
  @Exclude()
  @OneToMany(() => CommentEntity, (comment) => comment.publication)
  comments: CommentEntity[];

  @ApiHideProperty()
  @Exclude()
  @OneToMany(() => ReactionEntity, (reaction) => reaction.publication)
  reactions: ReactionEntity[];

  @CreateDateColumn({ type: 'timestamp', name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', name: 'deletedAt' })
  deletedAt: Date;
}