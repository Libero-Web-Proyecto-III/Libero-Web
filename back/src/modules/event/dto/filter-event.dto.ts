import { IsOptional, IsEnum } from 'class-validator';
import { EventStatus } from '../enum/eventStatus.enum';

export class FilterEventDto {
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}