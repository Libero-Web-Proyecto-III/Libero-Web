import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { GetAllEventQueryDto } from './dto/get-event-query.dto';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  findAll(@Query() query: GetAllEventQueryDto) {
    return this.eventService.findAll(query);
  }

  @Get(':uuid')
  findOne(@Param('uuid') uuid: string) {
    return this.eventService.findOneBy.uuid(uuid);
  }

  @Post()
  create(@Body() createEventDto: CreateEventDto, @Req() req: any) {
    return this.eventService.create(createEventDto, req.user);
  }

  @Patch(':uuid')
  update(@Param('uuid') uuid: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventService.update(uuid, updateEventDto);
  }

  @Delete(':uuid')
  remove(@Param('uuid') uuid: string) {
    return this.eventService.remove(uuid);
  }
}