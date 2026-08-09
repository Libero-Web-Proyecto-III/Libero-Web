import { PartialType } from '@nestjs/mapped-types';
import { ApiExtraModels } from '@nestjs/swagger';
import { CreateEventDto } from './create-event.dto';

@ApiExtraModels(CreateEventDto)
export class UpdateEventDto extends PartialType(CreateEventDto) {}