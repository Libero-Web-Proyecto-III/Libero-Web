import {
  IsString,
  IsDateString,
  IsOptional,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@ValidatorConstraint({ name: 'isDateRangeValid', async: false })
export class IsDateRangeValid implements ValidatorConstraintInterface {
  validate(endDate: string, args: ValidationArguments) {
    const { startDate } = args.object as CreateEventDto;
    if (!startDate || !endDate) return false;
    const now = new Date();
    return new Date(startDate) > now && new Date(endDate) > new Date(startDate);
  }
  defaultMessage() {
    return 'startDate debe ser posterior a hoy y anterior a endDate';
  }
}

export class CreateEventDto {
  @ApiProperty({
    description: 'Título del evento',
    example: 'Hackathon UNIP 2026',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Descripción detallada del evento',
    example: 'Evento de 24 horas para desarrollar soluciones tecnológicas en equipo.',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Fecha y hora de inicio del evento (debe ser posterior al momento actual)',
    example: '2026-09-15T08:00:00.000Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Fecha y hora de finalización del evento (debe ser posterior a startDate)',
    example: '2026-09-16T08:00:00.000Z',
  })
  @IsDateString()
  @Validate(IsDateRangeValid)
  endDate: string;

  @ApiPropertyOptional({
    description: 'UUID del tag asociado al evento',
    example: 'b3f1c2a4-5d6e-4f7a-8b9c-0d1e2f3a4b5c',
  })
  @IsOptional()
  @IsString()
  tagUuid?: string;
}