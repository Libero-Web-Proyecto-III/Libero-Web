import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// # Este bloque tiene como objetivo validar la estructura de la respuesta enviada a una pregunta individual
export class SubmitAnswerDto {
  @ApiProperty({ description: 'ID de la pregunta respondida', example: 1 })
  @IsInt()
  @IsNotEmpty()
  questionId: number;

  @ApiPropertyOptional({ description: 'ID de la opción seleccionada (para preguntas de selección)', example: 2 })
  @IsInt()
  @IsOptional()
  optionId?: number;

  @ApiPropertyOptional({ description: 'Arreglo de IDs de opciones seleccionadas (para selección múltiple)' })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  optionIds?: number[];

  @ApiPropertyOptional({ description: 'Valor de texto libre o puntuación', example: 'Excelente instalaciones' })
  @IsString()
  @IsOptional()
  textValue?: string;
}

// # Este bloque tiene como objetivo validar el paquete de respuestas enviado para completar la encuesta
export class SubmitSurveyResponseDto {
  @ApiProperty({ type: [SubmitAnswerDto], description: 'Arreglo con las respuestas a las preguntas' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerDto)
  @IsNotEmpty()
  answers: SubmitAnswerDto[];
}
