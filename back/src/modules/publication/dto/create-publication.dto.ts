import { IsString, IsOptional, IsArray, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePublicationDto {
  @ApiProperty({
    description: 'Título de la publicación (mínimo 3 caracteres)',
    example: 'Lanzamos la nueva versión de ForgeHub',
  })
  @IsString()
  @MinLength(3)
  title!: string;

  @ApiProperty({
    description: 'Contenido o descripción de la publicación',
    example: 'Hoy compartimos los avances del proyecto y cómo pueden contribuir.',
  })
  @IsString()
  content!: string;

  @ApiPropertyOptional({
    description: 'Lista de URLs de media adjunta (imágenes, videos o links)',
    example: ['https://cdn.forgehub.com/img1.png', 'https://youtu.be/xyz123'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  media?: string[];
}