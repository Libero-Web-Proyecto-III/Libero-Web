import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { SurveyQuestionEntity } from './survey-question.entity';
import { SurveyStatusEnum } from '../enums/survey.enum';

// # Este bloque tiene como objetivo mapear la tabla principal de encuestas dinámicas (surveys) en la base de datos MySQL
@Entity('survey')
export class SurveyEntity extends BaseEntity {
  @ApiProperty({
    description: 'Título de la encuesta',
    example: 'Encuesta de Satisfacción Estudiantil 2026',
  })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({
    description: 'Descripción detallada u objetivo de la encuesta',
    example: 'Evalúa la calidad del servicio educativo y las instalaciones.',
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    description: 'Indica si la encuesta puede ser respondida sin iniciar sesión',
    example: true,
  })
  @Column({ type: 'boolean', default: true })
  isPublic: boolean;

  @ApiProperty({
    description: 'Estado de publicación de la encuesta',
    enum: SurveyStatusEnum,
    example: SurveyStatusEnum.PUBLISHED,
  })
  @Column({
    type: 'enum',
    enum: SurveyStatusEnum,
    default: SurveyStatusEnum.DRAFT,
  })
  status: SurveyStatusEnum;

  @ApiProperty({
    description: 'Fecha de inicio de disponibilidad',
    example: '2026-09-15T00:00:00.000Z',
  })
  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @ApiProperty({
    description: 'Fecha límite de cierre de disponibilidad',
    example: '2026-09-30T23:59:59.000Z',
  })
  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  // # Este bloque define la relación con el usuario Administrador o Moderador que creó la encuesta
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: UserEntity;

  // # Este bloque define la relación de uno a muchos con las preguntas dinámicas de la encuesta
  @OneToMany(() => SurveyQuestionEntity, (question) => question.survey, {
    cascade: true,
    eager: true,
  })
  questions: SurveyQuestionEntity[];
}
