import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { GetAllEventQueryDto } from './dto/get-event-query.dto';
import { EventEntity } from './entities/event.entity';

@ApiTags('Events')
@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar eventos',
    description: 'Devuelve los eventos registrados, con filtros opcionales por estado y por tag.',
  })
  @ApiResponse({ status: 200, description: 'Listado de eventos', type: [EventEntity] })
  findAll(@Query() query: GetAllEventQueryDto) {
    return this.eventService.findAll(query);
  }

  @Get(':uuid')
  @ApiOperation({
    summary: 'Obtener un evento por UUID',
    description: 'Devuelve el detalle de un evento específico junto con su organizador y tag.',
  })
  @ApiParam({ name: 'uuid', description: 'UUID del evento', example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' })
  @ApiResponse({ status: 200, description: 'Evento encontrado', type: EventEntity })
  @ApiResponse({ status: 404, description: 'Evento no encontrado' })
  findOne(@Param('uuid') uuid: string) {
    return this.eventService.findOneBy.uuid(uuid);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear un evento',
    description: 'Crea un nuevo evento. Únicamente el moderador puede publicar eventos.',
  })
  @ApiResponse({ status: 201, description: 'Evento creado exitosamente', type: EventEntity })
  @ApiResponse({ status: 400, description: 'Datos inválidos o rango de fechas incorrecto' })
  create(@Body() createEventDto: CreateEventDto, @Req() req: any) {
    return this.eventService.create(createEventDto, req.user);
  }

  @Patch(':uuid')
  @ApiOperation({
    summary: 'Actualizar un evento',
    description: 'Modifica los datos de un evento existente, identificado por su UUID.',
  })
  @ApiParam({ name: 'uuid', description: 'UUID del evento', example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' })
  @ApiResponse({ status: 200, description: 'Evento actualizado', type: EventEntity })
  @ApiResponse({ status: 404, description: 'Evento no encontrado' })
  update(@Param('uuid') uuid: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventService.update(uuid, updateEventDto);
  }

  @Delete(':uuid')
  @ApiOperation({
    summary: 'Eliminar un evento',
    description: 'Elimina un evento existente de forma permanente.',
  })
  @ApiParam({ name: 'uuid', description: 'UUID del evento', example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' })
  @ApiResponse({ status: 200, description: 'Evento eliminado' })
  @ApiResponse({ status: 404, description: 'Evento no encontrado' })
  remove(@Param('uuid') uuid: string) {
    return this.eventService.remove(uuid);
  }
}