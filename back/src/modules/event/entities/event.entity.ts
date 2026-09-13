import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
    example: 'SINFONÍA NOCTURNA: GALA Y MÚSICA EN VIVO',
  })
  @Column()
  title: string;

  @ApiPropertyOptional({
    description: 'Subtítulo o lema del evento',
    example: 'Una velada inmersiva con la Orquesta Filarmónica Contemporánea',
  })
  @Column({ nullable: true, type: 'varchar', length: 500 })
  subtitle: string;

  @ApiPropertyOptional({
    description: 'Día del evento',
    example: '28',
  })
  @Column({ nullable: true, type: 'varchar', length: 10 })
  dateDay: string;

  @ApiPropertyOptional({
    description: 'Mes del evento',
    example: 'AGO',
  })
  @Column({ nullable: true, type: 'varchar', length: 10 })
  dateMonth: string;

  @ApiPropertyOptional({
    description: 'Horario del evento',
    example: '20:30 - 23:30 HRS',
  })
  @Column({ nullable: true, type: 'varchar', length: 100 })
  time: string;

  @ApiPropertyOptional({
    description: 'Lugar o recinto',
    example: 'Gran Teatro Metropolitano',
  })
  @Column({ nullable: true, type: 'varchar', length: 255 })
  location: string;

  @ApiPropertyOptional({
    description: 'Sala o ciudad',
    example: 'Sala Principal',
  })
  @Column({ nullable: true, type: 'varchar', length: 255 })
  city: string;

  @ApiProperty({
    description: 'Descripción detallada del evento',
  })
  @Column('text')
  description: string;

  @ApiPropertyOptional({
    description: 'URL de imagen de portada',
  })
  @Column({ type: 'text', nullable: true })
  imageUrl: string;

  @ApiPropertyOptional({
    description: 'Estado del evento: active / past',
    example: 'active',
  })
  @Column({ nullable: true, default: 'active', type: 'varchar', length: 50 })
  status: string;

  @ApiPropertyOptional({
    description: 'Fecha y hora de inicio',
    example: '2026-09-15T08:00:00.000Z',
  })
  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @ApiPropertyOptional({
    description: 'Fecha y hora de finalización',
    example: '2026-09-16T08:00:00.000Z',
  })
  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @ApiPropertyOptional({
    description: 'Usuario organizador del evento',
    type: () => UserEntity,
  })
  @JoinColumn({ name: 'organizer' })
  @ManyToOne(() => UserEntity, (user) => user.events, { nullable: true, onDelete: 'SET NULL' })
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