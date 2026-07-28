import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { TagEntity } from 'src/modules/tag/entities/tag.entity';

@Entity('event')
export class EventEntity {
  @PrimaryGeneratedColumn()
  index: number;

  @PrimaryColumn()
  @Generated('uuid')
  uuid: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @ManyToOne(() => UserEntity, (user) => user.events)
  organizer: UserEntity;

  @ManyToOne(() => TagEntity, { nullable: true })
  tag?: TagEntity | null;

  @CreateDateColumn({ type: 'timestamp', name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updatedAt' })
  updatedAt: Date;
}