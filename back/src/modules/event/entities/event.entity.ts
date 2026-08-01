import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from 'src/modules/user/entities/user.entity';

@Entity('event')
export class EventEntity {
  @PrimaryGeneratedColumn()
  index: number;

  @Column({ unique: true })
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

  @JoinColumn({ name: 'organizer' })
  @ManyToOne(() => UserEntity, (user) => user.events)
  organizer: UserEntity;

  @CreateDateColumn({ type: 'timestamp', name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updatedAt' })
  updatedAt: Date;
}