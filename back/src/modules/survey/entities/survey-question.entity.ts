import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SurveyEntity } from './survey.entity';
import { SurveyOptionEntity } from './survey-option.entity';
import { QuestionTypeEnum } from '../enums/survey.enum';

// # Este bloque tiene como objetivo mapear la entidad de preguntas dinámicas pertenecientes a una encuesta
@Entity('survey_question')
export class SurveyQuestionEntity extends BaseEntity {
  @ApiProperty({
    description: 'Enunciado de la pregunta',
    example: '¿Qué tan satisfecho estás con las instalaciones?',
  })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({
    description: 'Tipo de pregunta',
    enum: QuestionTypeEnum,
    example: QuestionTypeEnum.SINGLE_CHOICE,
  })
  @Column({
    type: 'enum',
    enum: QuestionTypeEnum,
    default: QuestionTypeEnum.SINGLE_CHOICE,
  })
  type: QuestionTypeEnum;

  @ApiProperty({
    description: 'Indica si la respuesta a la pregunta es obligatoria',
    example: true,
  })
  @Column({ type: 'boolean', default: true })
  isRequired: boolean;

  @ApiProperty({
    description: 'Orden numérico de la pregunta',
    example: 1,
  })
  @Column({ type: 'int', default: 0 })
  order: number;

  // # Este bloque vincula la pregunta a la encuesta correspondiente
  @ManyToOne(() => SurveyEntity, (survey) => survey.questions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'survey_id' })
  survey: SurveyEntity;

  // # Este bloque define la lista de opciones de respuesta asociadas a la pregunta
  @OneToMany(() => SurveyOptionEntity, (option) => option.question, {
    cascade: true,
    eager: true,
  })
  options: SurveyOptionEntity[];
}
