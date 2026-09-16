import { ApiExtraModels, PartialType } from '@nestjs/swagger';
import { CreatePublicationDto } from './create-publication.dto';

@ApiExtraModels(CreatePublicationDto)
export class UpdatePublicationDto extends PartialType(CreatePublicationDto) {}