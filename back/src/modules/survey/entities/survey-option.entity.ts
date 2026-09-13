import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SurveyQuestionEntity } from './survey-question.entity';

// # Este bloque tiene como objetivo mapear las opciones de respuesta elegibles para preguntas de selección
@Entity('survey_option')
export class SurveyOptionEntity extends BaseEntity {
  @ApiProperty({
    description: 'Texto de la opción de respuesta',
    example: 'Totalmente de acuerdo',
  })
  @Column({ type: 'varchar', length: 255 })
  optionText: string;

  @ApiProperty({
    description: 'Orden numérico de la opción',
    example: 1,
  })
  @Column({ type: 'int', default: 0 })
  order: number;

  // # Este bloque relaciona la opción con su pregunta contenedora
  @ManyToOne(() => SurveyQuestionEntity, (question) => question.options, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'question_id' })
  question: SurveyQuestionEntity;
}
