import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { Comment } from '../../comment/entity/comment.entity';
import { Reaction } from '../../reaction/entity/reaction.entity';

@Entity('publication')
export class Publication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.publications, { eager: false })
  author: User;

  @Column()
  title: string;

  @Column('simple-array', { nullable: true })
  media: string[];

  @Column('text')
  content: string;

  @OneToMany(() => Comment, (comment) => comment.publication)
  comments: Comment[];

  @OneToMany(() => Reaction, (reaction) => reaction.publication)
  reactions: Reaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}