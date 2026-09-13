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
    if (!startDate && !endDate) return true;
    if (!startDate || !endDate) return true;
    return new Date(endDate) >= new Date(startDate);
  }
  defaultMessage() {
    return 'endDate debe ser posterior o igual a startDate';
  }
}

export class CreateEventDto {
  @ApiProperty({
    description: 'Título del evento',
    example: 'SINFONÍA NOCTURNA: GALA Y MÚSICA EN VIVO',
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'Subtítulo o temática del evento',
    example: 'Una velada inmersiva con la Orquesta Filarmónica Contemporánea',
  })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional({
    description: 'Día del evento (ej: 28)',
    example: '28',
  })
  @IsOptional()
  @IsString()
  dateDay?: string;

  @ApiPropertyOptional({
    description: 'Mes del evento (ej: AGO)',
    example: 'AGO',
  })
  @IsOptional()
  @IsString()
  dateMonth?: string;

  @ApiPropertyOptional({
    description: 'Horario del evento (ej: 20:30 - 23:30 HRS)',
    example: '20:30 - 23:30 HRS',
  })
  @IsOptional()
  @IsString()
  time?: string;

  @ApiPropertyOptional({
    description: 'Lugar o recinto',
    example: 'Gran Teatro Metropolitano',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Sala o ciudad',
    example: 'Sala Principal',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    description: 'Descripción detallada del evento',
    example: 'Disfruta de una experiencia acústica y visual sin precedentes.',
  })
  @IsString()
  description: string;

  @ApiPropertyOptional({
    description: 'URL de imagen de portada',
    example: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1400&q=80',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Estado del evento: active / past',
    example: 'active',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Fecha y hora de inicio',
    example: '2026-09-15T08:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha y hora de finalización',
    example: '2026-09-16T08:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  @Validate(IsDateRangeValid)
  endDate?: string;

  @ApiPropertyOptional({
    description: 'UUID del tag asociado al evento',
    example: 'b3f1c2a4-5d6e-4f7a-8b9c-0d1e2f3a4b5c',
  })
  @IsOptional()
  @IsString()
  tagUuid?: string;
}