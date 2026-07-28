import { IsOptional, IsEnum, IsString } from 'class-validator';
import { EventStatus } from '../enum/eventStatus.enum';

export class GetAllEventQueryDto {
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @IsOptional()
  @IsString()
  tagUuid?: string;
}