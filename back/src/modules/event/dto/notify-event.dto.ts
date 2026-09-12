import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotifyEventDto {
  @ApiProperty({
    description: 'Título del evento a notificar',
    example: 'SINFONÍA NOCTURNA: GALA Y MÚSICA EN VIVO',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Subtítulo o descripción corta del evento',
    example: 'Una velada inmersiva con la Orquesta Filarmónica Contemporánea',
  })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiProperty({
    description: 'Fecha en formato legible',
    example: '28 de AGO 2026',
  })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    description: 'Horario del evento',
    example: '20:30 - 23:30 HRS',
  })
  @IsString()
  @IsNotEmpty()
  time: string;

  @ApiProperty({
    description: 'Lugar o recinto del evento',
    example: 'Gran Teatro Metropolitano (Sala Principal)',
  })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({
    description: 'Descripción detallada del evento',
    example: 'Disfruta de una experiencia acústica y visual sin precedentes...',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    description: 'URL de la imagen representativa del evento',
    example: 'https://images.unsplash.com/...',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
