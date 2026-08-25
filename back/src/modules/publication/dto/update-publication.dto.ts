import { PartialType } from '@nestjs/mapped-types';
import { ApiExtraModels } from '@nestjs/swagger';
import { CreatePublicationDto } from './create-publication.dto';

@ApiExtraModels(CreatePublicationDto)
export class UpdatePublicationDto extends PartialType(CreatePublicationDto) {}