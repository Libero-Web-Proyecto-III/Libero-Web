import { IsOptional, IsPositive, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetAllPublicationQueryDto {
  @ApiPropertyOptional({
    description: 'Número de página a consultar',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de resultados por página',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filtrar publicaciones por categoría (uuid)',
    example: '9c858901-8a57-4791-81fe-4c455b099bc9',
  })
  @IsOptional()
  @IsUUID()
  categoryUuid?: string;
}