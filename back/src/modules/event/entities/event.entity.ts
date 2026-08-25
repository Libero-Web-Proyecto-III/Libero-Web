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
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { UserEntity } from 'src/modules/user/entities/user.entity';

@Entity('event')
export class EventEntity {
  @ApiHideProperty()
  @PrimaryGeneratedColumn()
  index: number;

  @ApiProperty({
    description: 'Identificador único público del evento',
    example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  })
  @Column({ unique: true })
  @Generated('uuid')
  uuid: string;

  @ApiProperty({
    description: 'Título del evento',
    example: 'Hackathon UNIP 2026',
  })
  @Column()
  title: string;

  @ApiProperty({
    description: 'Descripción del evento',
    example: 'Evento de 24 horas para desarrollar soluciones tecnológicas en equipo.',
  })
  @Column('text')
  description: string;

  @ApiProperty({
    description: 'Fecha y hora de inicio',
    example: '2026-09-15T08:00:00.000Z',
  })
  @Column({ type: 'timestamp' })
  startDate: Date;

  @ApiProperty({
    description: 'Fecha y hora de finalización',
    example: '2026-09-16T08:00:00.000Z',
  })
  @Column({ type: 'timestamp' })
  endDate: Date;

  @ApiProperty({
    description: 'Usuario moderador que organiza el evento',
    type: () => UserEntity,
  })
  @JoinColumn({ name: 'organizer' })
  @ManyToOne(() => UserEntity, (user) => user.events)
  organizer: UserEntity;

  @ApiProperty({
    description: 'Fecha de creación del registro',
    example: '2026-08-08T14:30:00.000Z',
  })
  @CreateDateColumn({ type: 'timestamp', name: 'createdAt' })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de la última actualización del registro',
    example: '2026-08-08T14:30:00.000Z',
  })
  @UpdateDateColumn({ type: 'timestamp', name: 'updatedAt' })
  updatedAt: Date;
}