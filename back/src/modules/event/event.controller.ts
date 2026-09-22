import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, Res } from '@nestjs/common';
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

  @Get('preview/last-email')
  @ApiOperation({
    summary: 'Previsualizar el último correo generado',
  })
  previewLastEmail(@Res() res: any) {
    const html = this.eventService.getLastEmailHtml();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (!html) {
      return res.send(`
        <body style="background: #111; color: #eee; font-family: sans-serif; text-align: center; padding: 50px;">
          <h2>🔔 Ningún correo generado todavía en esta sesión</h2>
          <p>Presiona <strong>"Notificarme Evento"</strong> en el frontend y luego recarga esta pestaña.</p>
        </body>
      `);
    }
    return res.send(html);
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