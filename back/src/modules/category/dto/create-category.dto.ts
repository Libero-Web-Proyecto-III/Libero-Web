import { IsHexColor, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Nombre de la categoría (mínimo 3 caracteres)', example: 'Comunidad' })
  @IsString()
  @MinLength(3)
  name!: string;

  @ApiPropertyOptional({ description: 'Color de la categoría en formato hexadecimal', example: '#f97316' })
  @IsOptional()
  @IsHexColor()
  color?: string;

  @ApiPropertyOptional({ description: 'Emoji representativo de la categoría', example: '👥' })
  @IsOptional()
  @IsString()
  @MaxLength(4)
  icon?: string;
}