import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { GetAllEventQueryDto } from './dto/get-event-query.dto';
import { EventEntity } from './entities/event.entity';
import { NotifyEventDto } from './dto/notify-event.dto';
import { PRIVATE } from 'src/common/decorator/private.decorator';
import { ROLES } from 'src/common/decorator/roles.decorator';
import { enumRol } from 'src/common/enums/rol.enum';

@ApiTags('Events')
@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) { }


  @PRIVATE()
  @ApiBearerAuth()
  @Get('user/subscriptions')
  @ApiOperation({
    summary: 'Obtener los UUIDs de los eventos a los que está suscrito el usuario',
  })
  getUserSubscriptions(@Req() req: any) {
    const userId = req.user?.index ?? req.user?.id;
    return this.eventService.getUserSubscribedEventUuids(userId);
  }

  @PRIVATE()
  @ApiBearerAuth()
  @Post(':uuid/subscribe')
  @ApiOperation({
    summary: 'Suscribir al usuario para recibir recordatorio 24 horas antes del evento',
  })
  @ApiParam({ name: 'uuid', description: 'UUID del evento' })
  subscribeToEvent(@Param('uuid') uuid: string, @Req() req: any) {
    return this.eventService.subscribeUserToEvent(uuid, req.user);
  }

  @PRIVATE()
  @ApiBearerAuth()
  @Delete(':uuid/subscribe')
  @ApiOperation({
    summary: 'Cancelar suscripción / recordatorio del evento',
  })
  @ApiParam({ name: 'uuid', description: 'UUID del evento' })
  unsubscribeFromEvent(@Param('uuid') uuid: string, @Req() req: any) {
    return this.eventService.unsubscribeUserFromEvent(uuid, req.user);
  }

  @PRIVATE()
  @ROLES([enumRol.ADMIN, enumRol.MOD])
  @ApiBearerAuth()
  @Get(':uuid/subscribers')
  @ApiOperation({
    summary: 'Consultar usuarios que tienen la notificación activa de un evento (Admin / Mod)',
  })
  @ApiParam({ name: 'uuid', description: 'UUID del evento' })
  getEventSubscribers(@Param('uuid') uuid: string) {
    return this.eventService.getEventSubscribers(uuid);
  }

  @PRIVATE()
  @ROLES([enumRol.ADMIN, enumRol.MOD])
  @Post('cron/check-reminders')
  @ApiOperation({
    summary: 'Ejecutar manualmente la revisión de recordatorios 24h (Admin / Mod)',
  })
  triggerCronReminders() {
    return this.eventService.triggerReminderCron();
  }

  @PRIVATE()
  @ApiBearerAuth()
  @Post('notify')
  @ApiOperation({
    summary: 'Notificar evento por correo al usuario',
  })
  @ApiResponse({ status: 200, description: 'Notificación enviada correctamente' })
  @ApiResponse({ status: 401, description: 'Usuario no autenticado' })
  notifyEvent(@Body() notifyEventDto: NotifyEventDto, @Req() req: any) {
    return this.eventService.notifyEvent(notifyEventDto, req.user);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar eventos',
    description: 'Devuelve los eventos registrados en la base de datos.',
  })
  @ApiResponse({ status: 200, description: 'Listado de eventos', type: [EventEntity] })
  findAll(@Query() query: GetAllEventQueryDto) {
    return this.eventService.findAll(query);
  }

  @Get(':uuid')
  @ApiOperation({
    summary: 'Obtener un evento por UUID',
  })
  @ApiParam({ name: 'uuid', description: 'UUID del evento' })
  @ApiResponse({ status: 200, description: 'Evento encontrado', type: EventEntity })
  @ApiResponse({ status: 404, description: 'Evento no encontrado' })
  findOne(@Param('uuid') uuid: string) {
    return this.eventService.findOneBy.uuid(uuid);
  }

  @Post()
  @PRIVATE()
  @ROLES([enumRol.ADMIN, enumRol.MOD, enumRol.USER])
  @ApiOperation({
    summary: 'Crear un evento',
    description: 'Crea un nuevo evento en la base de datos.',
  })
  @ApiResponse({ status: 201, description: 'Evento creado exitosamente', type: EventEntity })
  create(@Body() createEventDto: CreateEventDto, @Req() req: any) {
    return this.eventService.create(createEventDto, req.user);
  }

  @Patch(':uuid')
  @PRIVATE()
  @ROLES([enumRol.ADMIN, enumRol.MOD, enumRol.USER])
  @ApiOperation({
    summary: 'Actualizar un evento',
  })
  @ApiParam({ name: 'uuid', description: 'UUID del evento' })
  @ApiResponse({ status: 200, description: 'Evento actualizado', type: EventEntity })
  update(@Param('uuid') uuid: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventService.update(uuid, updateEventDto);
  }

  @Delete(':uuid')
  @PRIVATE()
  @ROLES([enumRol.ADMIN, enumRol.MOD, enumRol.USER])
  @ApiOperation({
    summary: 'Eliminar un evento',
  })
  @ApiParam({ name: 'uuid', description: 'UUID del evento' })
  @ApiResponse({ status: 200, description: 'Evento eliminado' })
  remove(@Param('uuid') uuid: string, @Req() req: any) {
    return this.eventService.remove(uuid, req.user);
  }
}