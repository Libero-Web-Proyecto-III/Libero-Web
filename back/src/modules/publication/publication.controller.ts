import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { PublicationService } from './publication.service';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { GetAllPublicationQueryDto } from './dto/get-publication-query.dto';

@Controller('publications')
export class PublicationController {
  constructor(private readonly publicationService: PublicationService) {}

  @Get()
  findAll(@Query() query: GetAllPublicationQueryDto) {
    return this.publicationService.findAll(query);
  }

  @Get(':uuid')
  findOne(@Param('uuid') uuid: string) {
    return this.publicationService.findOneBy.uuid(uuid);
  }

  @Post()
  create(@Body() createPublicationDto: CreatePublicationDto, @Req() req: any) {
    return this.publicationService.create(createPublicationDto, req.user);
  }

  @Patch(':uuid')
  update(@Param('uuid') uuid: string, @Body() updatePublicationDto: UpdatePublicationDto) {
    return this.publicationService.update(uuid, updatePublicationDto);
  }

  @Delete(':uuid')
  remove(@Param('uuid') uuid: string) {
    return this.publicationService.remove(uuid);
  }
}