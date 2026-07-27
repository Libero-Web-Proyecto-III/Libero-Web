import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PublicationService } from './publication.service';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { PaginationDto } from './dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolsGuard } from '../../common/guards/rols.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('publications')
export class PublicationController {
  constructor(private readonly publicationService: PublicationService) {}

  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.publicationService.findAll(pagination);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.publicationService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreatePublicationDto, @Req() req: any) {
    return this.publicationService.create(dto, req.user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolsGuard)
  @Roles('moderator', 'admin')
  update(@Param('id') id: string, @Body() dto: UpdatePublicationDto) {
    return this.publicationService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolsGuard)
  @Roles('moderator', 'admin')
  remove(@Param('id') id: string) {
    return this.publicationService.remove(id);
  }
}