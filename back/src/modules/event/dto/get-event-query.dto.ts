import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus } from '../enum/eventStatus.enum';

export class GetAllEventQueryDto {
  @ApiPropertyOptional({
    description: 'Filtra los eventos por estado (próximo, en curso, finalizado)',
    enum: EventStatus,
    example: EventStatus.ONGOING,
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({
    description: 'Filtra los eventos por el UUID de un tag',
    example: 'b3f1c2a4-5d6e-4f7a-8b9c-0d1e2f3a4b5c',
  })
  @IsOptional()
  @IsString()
  tagUuid?: string;
}