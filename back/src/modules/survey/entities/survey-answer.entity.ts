import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SurveyResponseEntity } from './survey-response.entity';
import { SurveyQuestionEntity } from './survey-question.entity';
import { SurveyOptionEntity } from './survey-option.entity';

// # Este bloque tiene como objetivo mapear la tabla de respuestas individuales enviadas por un usuario para cada pregunta
@Entity('survey_answer')
export class SurveyAnswerEntity extends BaseEntity {
  // # Este bloque vincula la respuesta individual con el registro general del intento de encuesta (survey_response)
  @ManyToOne(() => SurveyResponseEntity, (response) => response.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'response_id' })
  response: SurveyResponseEntity;

  // # Este bloque referencia la pregunta específica a la cual corresponde la respuesta
  @ManyToOne(() => SurveyQuestionEntity, { eager: true })
  @JoinColumn({ name: 'question_id' })
  question: SurveyQuestionEntity;

  // # Este bloque referencia la opción de respuesta seleccionada (para preguntas de selección única o múltiple)
  @ManyToOne(() => SurveyOptionEntity, { nullable: true, eager: true })
  @JoinColumn({ name: 'option_id' })
  selectedOption?: SurveyOptionEntity | null;

  // # Este bloque almacena el texto ingresado en preguntas abiertas o la calificación numérica para preguntas de puntuación
  @ApiProperty({ description: 'Valor de texto libre o número en string', example: 'Excelente servicio' })
  @Column({ type: 'text', nullable: true })
  textValue?: string | null;
}
