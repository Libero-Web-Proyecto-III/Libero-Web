import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionTypeEnum, SurveyStatusEnum } from '../enums/survey.enum';

export class CreateSurveyOptionDto {
  @ApiProperty({ description: 'Texto de la opción de respuesta', example: 'Totalmente de acuerdo' })
  @IsString()
  @IsNotEmpty()
  optionText: string;

  @ApiPropertyOptional({ description: 'Orden de la opción', example: 1 })
  @IsInt()
  @IsOptional()
  order?: number;
}

export class CreateSurveyQuestionDto {
  @ApiProperty({ description: 'Enunciado de la pregunta', example: '¿Cómo evalúas el campus?' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ enum: QuestionTypeEnum, description: 'Tipo de pregunta' })
  @IsEnum(QuestionTypeEnum)
  type: QuestionTypeEnum;

  @ApiPropertyOptional({ description: '¿Es obligatoria?', example: true })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @ApiPropertyOptional({ description: 'Orden de la pregunta', example: 1 })
  @IsInt()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ type: [CreateSurveyOptionDto], description: 'Opciones de respuesta (para preguntas de selección)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSurveyOptionDto)
  @IsOptional()
  options?: CreateSurveyOptionDto[];
}

export class CreateSurveyDto {
  @ApiProperty({ description: 'Título de la encuesta', example: 'Encuesta Institucional 2026' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Descripción o propósito de la encuesta' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '¿Permite acceso público?', example: true })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({ enum: SurveyStatusEnum, description: 'Estado inicial de la encuesta' })
  @IsEnum(SurveyStatusEnum)
  @IsOptional()
  status?: SurveyStatusEnum;

  @ApiPropertyOptional({ description: 'Fecha de inicio (ISO string)' })
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({ description: 'Fecha de finalización (ISO string)' })
  @IsOptional()
  endDate?: Date;

  @ApiProperty({ type: [CreateSurveyQuestionDto], description: 'Lista de preguntas asociadas a la encuesta' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSurveyQuestionDto)
  @IsNotEmpty()
  questions: CreateSurveyQuestionDto[];
}
