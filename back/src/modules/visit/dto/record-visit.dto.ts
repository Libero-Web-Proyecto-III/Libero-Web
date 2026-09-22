import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class RecordVisitDto {
  @ApiProperty({ example: '/eventos', description: 'Ruta o URL visitada' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  path: string;

  @ApiPropertyOptional({ example: 'a9b2c3d4-e5f6-7890', description: 'Identificador anónimo del visitante' })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  visitorId?: string;

  @ApiPropertyOptional({ example: 'direct', description: 'Referrer o fuente de la visita' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  referrer?: string;
}
