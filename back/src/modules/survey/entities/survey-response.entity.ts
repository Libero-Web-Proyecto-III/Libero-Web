import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SurveyEntity } from './survey.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { SurveyAnswerEntity } from './survey-answer.entity';

// # Este bloque tiene como objetivo mapear la cabecera general de un envío/intento de respuesta de encuesta
@Entity('survey_response')
export class SurveyResponseEntity extends BaseEntity {
  // # Este bloque relaciona la respuesta entregada con la encuesta original correspondiente
  @ManyToOne(() => SurveyEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'survey_id' })
  survey: SurveyEntity;

  // # Este bloque vincula opcionalmente al usuario registrado que envió la respuesta (null en encuestas públicas)
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity | null;

  // # Este bloque guarda el hash de la dirección IP u origen para control anti-spam en respuestas públicas
  @ApiProperty({ description: 'Hash de la IP o sesión del encuestado', example: 'a1b2c3d4e5' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  ipHash?: string | null;

  // # Este bloque guarda la fecha y hora exacta en que se registró el envío de la respuesta
  @CreateDateColumn({ type: 'timestamp' })
  submittedAt: Date;

  // # Este bloque almacena la colección de respuestas específicas a cada pregunta
  @OneToMany(() => SurveyAnswerEntity, (answer) => answer.response, {
    cascade: true,
    eager: true,
  })
  answers: SurveyAnswerEntity[];
}
