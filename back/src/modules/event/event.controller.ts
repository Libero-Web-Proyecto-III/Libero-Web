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
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { FilterEventDto } from './dto/filter-event.dto';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  findAll(@Query() filter: FilterEventDto) {
    return this.eventService.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolsGuard)
  @Rols('moderator')
  create(@Body() dto: CreateEventDto, @Req() req: any) {
    return this.eventService.create(dto, req.user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolsGuard)
  @Rols('moderator')
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.eventService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolsGuard)
  @Rols('moderator')
  remove(@Param('id') id: string) {
    return this.eventService.remove(id);
  }
}