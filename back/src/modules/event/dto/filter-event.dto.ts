import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus } from '../enum/eventStatus.enum';

export class FilterEventDto {
  @ApiPropertyOptional({
    description: 'Estado del evento según su fecha',
    enum: EventStatus,
    example: EventStatus.UPCOMING,
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}