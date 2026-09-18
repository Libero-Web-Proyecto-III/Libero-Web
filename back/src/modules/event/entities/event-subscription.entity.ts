import { Column, Entity, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { EventEntity } from './event.entity';

@Entity('event_subscription')
@Index(['user', 'event'], { unique: true })
export class EventSubscriptionEntity extends BaseEntity {
  @ApiProperty({
    description: 'Usuario suscrito al evento',
    type: () => UserEntity,
  })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userIndex' })
  user: UserEntity;

  @ApiProperty({
    description: 'Evento al que se suscribió',
    type: () => EventEntity,
  })
  @ManyToOne(() => EventEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventIndex' })
  event: EventEntity;

  @ApiProperty({
    description: 'Indica si ya se envió el recordatorio de 24 horas antes',
    default: false,
  })
  @Column({ type: 'boolean', default: false })
  notified24h: boolean;

  @ApiProperty({
    description: 'Fecha y hora en que se envió el recordatorio de 24 horas',
    nullable: true,
  })
  @Column({ type: 'timestamp', nullable: true })
  notified24hAt: Date | null;

  @ApiProperty({
    description: 'Indica si ya se envió la notificación de finalización del evento',
    default: false,
  })
  @Column({ type: 'boolean', default: false })
  notifiedEnded: boolean;

  @ApiProperty({
    description: 'Fecha y hora en que se envió la notificación de finalización del evento',
    nullable: true,
  })
  @Column({ type: 'timestamp', nullable: true })
  notifiedEndedAt: Date | null;
}
