import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../user/entities/user.entity';

@Entity('password_reset_token')
export class PasswordResetTokenEntity extends BaseEntity {
  @Column({ unique: true, length: 64 })
  tokenHash: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  usedAt: Date | null;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userIndex' })
  user: UserEntity;
}