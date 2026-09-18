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

  @Get('preview/dashboard')
  @ApiOperation({
    summary: 'Panel de verificación visual de correos y estado de notificaciones',
  })
  async previewDashboard(@Res() res: any) {
    const logs = this.eventService.getEmailLogs();
    const eventsWithSubs = await this.eventService.getAllEventsWithSubscribersSummary();

    const rowsHtml = logs.length
      ? logs
          .map(
            (log, idx) => `
        <tr style="border-bottom: 1px solid #2a2a2a;">
          <td style="padding: 12px; color: #aaa;">#${logs.length - idx}</td>
          <td style="padding: 12px; color: #eee;">${new Date(log.timestamp).toLocaleTimeString()}</td>
          <td style="padding: 12px;">
            <span style="display:inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: bold; text-transform: uppercase; ${
              log.mode === 'reminder24h'
                ? 'background: rgba(212,175,55,0.2); color: #f5c842; border: 1px solid #d4af37;'
                : log.mode === 'cancellation'
                ? 'background: rgba(220,53,69,0.2); color: #ff6b6b; border: 1px solid #dc3545;'
                : log.mode === 'ended'
                ? 'background: rgba(13,202,240,0.2); color: #0dcaf0; border: 1px solid #0dcaf0;'
                : 'background: rgba(40,167,69,0.2); color: #28a745; border: 1px solid #28a745;'
            }">
              ${log.mode}
            </span>
          </td>
          <td style="padding: 12px; color: #fff; font-weight: bold;">${log.eventTitle}</td>
          <td style="padding: 12px; color: #bbb;">${log.recipient}</td>
          <td style="padding: 12px;">
            <span style="font-size: 12px; color: ${
              log.status === 'sent' ? '#28a745' : log.status === 'router_timeout_handled' ? '#f5c842' : '#17a2b8'
            };">
              ${log.status === 'sent' ? '✅ Entregado SMTP' : log.status === 'router_timeout_handled' ? '⚠️ Timeout Router (Generado OK)' : 'ℹ️ Simulado'}
            </span>
          </td>
          <td style="padding: 12px; text-align: center;">
            <a href="/events/preview/email/${log.id}" target="_blank" style="display:inline-block; background: #d4af37; color: #000; font-weight: bold; text-decoration: none; padding: 6px 14px; border-radius: 6px; font-size: 12px;">
              Ver Correo ↗
            </a>
          </td>
        </tr>
      `,
          )
          .join('')
      : `
        <tr>
          <td colspan="7" style="padding: 30px; text-align: center; color: #888;">
            No se han registrado envíos en la sesión actual. Activa una suscripción o genera una muestra arriba.
          </td>
        </tr>
      `;

    const subscribersHtml = eventsWithSubs.length
      ? eventsWithSubs
          .map(
            (ev) => `
        <div style="background: #181c24; border: 1px solid #2d333f; border-radius: 10px; margin-bottom: 16px; padding: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #282f3d; padding-bottom: 12px; margin-bottom: 12px;">
            <div>
              <span style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: ${ev.status === 'active' ? '#28a745' : '#888'};">
                ● ESTADO: ${ev.status.toUpperCase()}
              </span>
              <h4 style="font-size: 16px; color: #fff; margin-top: 4px;">${ev.title}</h4>
              <p style="font-size: 12px; color: #aaa;">Fecha: ${ev.date} | Horario: ${ev.time || 'N/A'}</p>
            </div>
            <div style="text-align: right;">
              <span style="display: inline-block; background: rgba(212,175,55,0.15); border: 1px solid #d4af37; color: #f5c842; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                🔔 ${ev.subscriberCount} ${ev.subscriberCount === 1 ? 'Usuario con Notificación' : 'Usuarios con Notificación'}
              </span>
            </div>
          </div>

          ${
            ev.subscribers.length
              ? `
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #ccc;">
              <thead>
                <tr style="border-bottom: 1px solid #2a2a2a; text-align: left; color: #888;">
                  <th style="padding: 8px;">Usuario</th>
                  <th style="padding: 8px;">Correo</th>
                  <th style="padding: 8px;">Recordatorio 24h</th>
                  <th style="padding: 8px;">Aviso Finalizado</th>
                  <th style="padding: 8px;">Fecha Suscripción</th>
                </tr>
              </thead>
              <tbody>
                ${ev.subscribers
                  .map(
                    (s: any) => `
                  <tr style="border-bottom: 1px solid #20242e;">
                    <td style="padding: 8px; color: #fff; font-weight: 600;">${s.name}</td>
                    <td style="padding: 8px; color: #d4af37;">${s.email}</td>
                    <td style="padding: 8px;">
                      <span style="color: ${s.notified24h ? '#28a745' : '#aaa'};">
                        ${s.notified24h ? '✅ Enviado' : '⏳ Pendiente'}
                      </span>
                    </td>
                    <td style="padding: 8px;">
                      <span style="color: ${s.notifiedEnded ? '#28a745' : '#aaa'};">
                        ${s.notifiedEnded ? '✅ Enviado' : '⏳ Pendiente'}
                      </span>
                    </td>
                    <td style="padding: 8px; color: #888;">${new Date(s.subscribedAt).toLocaleString()}</td>
                  </tr>
                `,
                  )
                  .join('')}
              </tbody>
            </table>
          `
              : `<p style="font-size: 12px; color: #777; font-style: italic; margin-top: 4px;">No hay usuarios suscritos a este evento todavía.</p>`
          }
        </div>
      `,
          )
          .join('')
      : `<p style="color: #888;">No hay eventos registrados en el sistema.</p>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Panel de Notificaciones - Líbero Cobre</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: #0f1115; color: #eee; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 30px 20px; }
          .container { max-width: 1050px; margin: 0 auto; }
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #d4af37; padding-bottom: 20px; margin-bottom: 25px; }
          .logo { font-size: 24px; font-weight: 800; color: #d4af37; letter-spacing: 1px; }
          .badge-info { background: #1a1e26; border: 1px solid #333; padding: 6px 14px; border-radius: 20px; font-size: 13px; color: #ccc; }
          .alert-box { background: #161b22; border-left: 4px solid #d4af37; padding: 18px 20px; border-radius: 6px; margin-bottom: 30px; line-height: 1.6; }
          .grid-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 35px; }
          .card { background: #181c24; border: 1px solid #2d333f; border-radius: 12px; padding: 22px; display: flex; flex-direction: column; justify-content: space-between; }
          .card h3 { font-size: 16px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
          .card p { font-size: 13px; color: #999; margin-bottom: 18px; line-height: 1.5; }
          .btn { display: block; text-align: center; padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: bold; text-decoration: none; transition: 0.2s; }
          .btn-gold { background: #d4af37; color: #111; }
          .btn-gold:hover { background: #b8972e; }
          .btn-red { background: #dc3545; color: #fff; }
          .btn-red:hover { background: #bd2130; }
          .btn-cyan { background: #0dcaf0; color: #111; }
          .btn-cyan:hover { background: #0bacbe; }
          .table-box { background: #181c24; border: 1px solid #2d333f; border-radius: 12px; overflow: hidden; margin-top: 15px; }
          table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
          th { background: #13161c; padding: 14px 12px; color: #bbb; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">⚡ LÍBERO COBRE &mdash; CENTRO DE NOTIFICACIONES</div>
            <div class="badge-info">Servidor Local (Puerto 3000)</div>
          </div>

          <div class="alert-box">
            <h4 style="color: #d4af37; margin-bottom: 6px;">💡 Diagnóstico y Arquitectura de Envíos Masivos</h4>
            <p style="font-size: 14px; color: #ccc;">
              El sistema cuenta con soporte para <strong>envíos masivos concurrentes en lotes (batch chunks de 10)</strong> con <code>Promise.allSettled</code>. Esto garantiza que si 50 o 500 usuarios tienen la notificación encendida, se envíen en paralelo sin bloquear el servidor y con tolerancia a fallos por destinatario.
            </p>
          </div>

          <h3 style="margin-bottom: 15px; color: #eee;">🎯 Plantillas Visuales de los 3 Estados</h3>
          <div class="grid-cards">
            <div class="card" style="border-top: 3px solid #d4af37;">
              <div>
                <h3 style="color: #f5c842;">⏰ 1. Recordatorio 24h Antes</h3>
                <p>Avisa al usuario exactamente 24 horas antes de la hora de inicio con el banner dorado y la fecha exacta.</p>
              </div>
              <a href="/events/preview/sample/reminder24h" target="_blank" class="btn btn-gold">Abrir Plantilla 24 Horas ↗</a>
            </div>

            <div class="card" style="border-top: 3px solid #dc3545;">
              <div>
                <h3 style="color: #ff6b6b;">⚠️ 2. Evento Cancelado</h3>
                <p>Avisa a los usuarios suscritos cuando un administrador o moderador elimina un evento activo.</p>
              </div>
              <a href="/events/preview/sample/cancellation" target="_blank" class="btn btn-red">Abrir Plantilla Cancelación ↗</a>
            </div>

            <div class="card" style="border-top: 3px solid #0dcaf0;">
              <div>
                <h3 style="color: #0dcaf0;">🏁 3. Evento Finalizado (Vencido)</h3>
                <p>Se envía automáticamente cuando la hora actual supera la hora de fin del evento y pasa a "past".</p>
              </div>
              <a href="/events/preview/sample/ended" target="_blank" class="btn btn-cyan">Abrir Plantilla Finalizado ↗</a>
            </div>
          </div>

          <!-- SECCIÓN: USUARIOS CON NOTIFICACIÓN ACTIVA POR EVENTO -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 40px; margin-bottom: 16px;">
            <h3>👥 Usuarios con Notificación Activa por Evento</h3>
            <span style="font-size: 12px; color: #888;">Total eventos registrados: ${eventsWithSubs.length}</span>
          </div>

          ${subscribersHtml}

          <!-- SECCIÓN: HISTORIAL DE CORREOS -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 40px; margin-bottom: 12px;">
            <h3>📋 Historial de Correos Disparados en esta Sesión</h3>
            <span style="font-size: 12px; color: #888;">Total registrados: ${logs.length}</span>
          </div>

          <div class="table-box">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Hora</th>
                  <th>Tipo / Modo</th>
                  <th>Evento</th>
                  <th>Destinatario</th>
                  <th>Estado</th>
                  <th style="text-align: center;">Visualizar</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      </body>
      </html>
    `);
  }

  @Get('preview/sample/:mode')
  @ApiOperation({
    summary: 'Previsualizar una plantilla de ejemplo según el modo (reminder24h, cancellation, ended, confirmation)',
  })
  previewSample(@Param('mode') mode: string, @Res() res: any) {
    const html = this.eventService.getSampleEmailHtml(mode);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  }

  @Get('preview/email/:id')
  @ApiOperation({
    summary: 'Previsualizar un correo específico generado del historial',
  })
  previewSpecificEmail(@Param('id') id: string, @Res() res: any) {
    const log = this.eventService.getEmailLogById(id);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (!log) {
      return res.send(`
        <body style="background: #111; color: #eee; font-family: sans-serif; text-align: center; padding: 50px;">
          <h2>❌ Correo no encontrado en el historial de la sesión</h2>
          <p><a href="/events/preview/dashboard" style="color: #d4af37;">Volver al Panel de Previsualización</a></p>
        </body>
      `);
    }
    return res.send(log.html);
  }

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
          <p style="margin: 20px 0; color: #aaa;">Puedes abrir el panel general con las 3 plantillas aquí:</p>
          <a href="/events/preview/dashboard" style="display:inline-block; background: #d4af37; color: #000; padding: 10px 20px; border-radius: 6px; font-weight: bold; text-decoration: none;">
            Abrir Panel de Notificaciones ↗
          </a>
        </body>
      `);
    }
    return res.send(html);
  }

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