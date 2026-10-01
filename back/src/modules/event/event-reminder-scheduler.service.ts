import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventSubscriptionEntity } from './entities/event-subscription.entity';
import { MailService } from '../mail/mail.service';
import { EventEntity } from './entities/event.entity';

const MONTH_INDEX_MAP: Record<string, number> = {
  ENE: 0, ENERO: 0,
  FEB: 1, FEBRERO: 1,
  MAR: 2, MARZO: 2,
  ABR: 3, ABRIL: 3,
  MAY: 4, MAYO: 4,
  JUN: 5, JUNIO: 5,
  JUL: 6, JULIO: 6,
  AGO: 7, AGOSTO: 7,
  SEP: 8, SEPTIEMBRE: 8,
  OCT: 9, OCTUBRE: 9,
  NOV: 10, NOVIEMBRE: 10,
  DIC: 11, DICIEMBRE: 11,
};

export interface EventDateInfo {
  startDate?: Date | string | null;
  dateDay?: string | null;
  dateMonth?: string | null;
  time?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}

export function computeEventStartDate(event: EventDateInfo): Date {
  if (event.startDate && !isNaN(new Date(event.startDate).getTime())) {
    const d = new Date(event.startDate);
    // Si la fecha ya está en el futuro o fue especificada explícitamente, la respetamos
    if (d.getFullYear() > 2000) return d;
  }

  const now = new Date();
  const currentYear = now.getFullYear();

  let monthIndex = now.getMonth();
  if (event.dateMonth) {
    const mKey = event.dateMonth.trim().toUpperCase();
    if (MONTH_INDEX_MAP[mKey] !== undefined) {
      monthIndex = MONTH_INDEX_MAP[mKey];
    }
  }

  let day = now.getDate();
  if (event.dateDay) {
    const parsedDay = parseInt(event.dateDay.trim(), 10);
    if (!isNaN(parsedDay) && parsedDay >= 1 && parsedDay <= 31) {
      day = parsedDay;
    }
  }

  let hours = 20;
  let minutes = 0;
  if (event.startTime) {
    const parts = event.startTime.trim().split(':');
    if (parts.length >= 2) {
      hours = parseInt(parts[0], 10);
      minutes = parseInt(parts[1], 10);
    }
  } else if (event.time) {
    const match = event.time.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      hours = parseInt(match[1], 10);
      minutes = parseInt(match[2], 10);
    }
  }

  const target = new Date(currentYear, monthIndex, day, hours, minutes, 0);
  return target;
}

export function computeEventEndDate(event: EventDateInfo, startDate: Date): Date {
  if (event.endTime) {
    const parts = event.endTime.trim().split(':');
    if (parts.length >= 2) {
      const endHours = parseInt(parts[0], 10);
      const endMinutes = parseInt(parts[1], 10);
      let end = new Date(startDate);
      end.setHours(endHours, endMinutes, 0, 0);
      if (end.getTime() <= startDate.getTime()) {
        end = new Date(end.getTime() + 24 * 3600 * 1000);
      }
      return end;
    }
  }
  return new Date(startDate.getTime() + 4 * 3600 * 1000);
}

@Injectable()
export class EventReminderSchedulerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(EventReminderSchedulerService.name);

  constructor(
    @InjectRepository(EventSubscriptionEntity)
    private readonly subscriptionRepo: Repository<EventSubscriptionEntity>,
    @InjectRepository(EventEntity)
    private readonly eventRepo: Repository<EventEntity>,
    private readonly mailService: MailService,
  ) {}

  onApplicationBootstrap() {
    this.logger.log('Iniciando servicio programador de eventos (24h previas, vencimiento y finalización)...');
    // Ejecuta una revisión inicial en segundo plano tras levantar la aplicación
    setTimeout(() => {
      this.runFullEventCycleCheck().catch((err) => {
        this.logger.warn(`Error en verificación inicial de eventos: ${err?.message || err}`);
      });
    }, 5000);
  }

  /**
   * Tarea programada: se ejecuta cada minuto para evaluar:
   * 1. Recordatorios de 24 horas previas
   * 2. Eventos cuya hora ya pasó para marcarlos automáticamente como vencidos y notificar su finalización
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledCron(): Promise<void> {
    await this.runFullEventCycleCheck();
  }

  async runFullEventCycleCheck(): Promise<{
    remindersChecked: number;
    remindersSent: number;
    endedEventsCount: number;
    endedNotificationsSent: number;
  }> {
    const reminderResult = await this.checkAndSendUpcomingReminders();
    const endedResult = await this.checkAndProcessEndedEvents();

    return {
      remindersChecked: reminderResult.checked,
      remindersSent: reminderResult.sent,
      endedEventsCount: endedResult.eventsMovedToPast,
      endedNotificationsSent: endedResult.notificationsSent,
    };
  }

  /**
   * Revisa eventos activos cuya hora de término ya venció, los cambia a 'past'
   * y despacha a cada usuario suscrito el correo de que el evento ha finalizado.
   */
  async checkAndProcessEndedEvents(): Promise<{ eventsMovedToPast: number; notificationsSent: number }> {
    const activeEvents = await this.eventRepo.find({
      where: { status: 'active' },
    });

    if (!activeEvents || activeEvents.length === 0) {
      return { eventsMovedToPast: 0, notificationsSent: 0 };
    }

    const now = new Date();
    let eventsMoved = 0;
    let notificationsSent = 0;

    for (const event of activeEvents) {
      try {
        const start = computeEventStartDate(event);
        const end = event.endDate && !isNaN(new Date(event.endDate).getTime())
          ? new Date(event.endDate)
          : computeEventEndDate(event, start);

        // Si la hora actual ya superó la fecha/hora de finalización
        if (now.getTime() > end.getTime()) {
          this.logger.log(
            `[EVENTO FINALIZADO] El evento "${event.title}" ha superado su horario (Finalizó: ${end.toISOString()}). Marcando como 'past'.`,
          );

          event.status = 'past';
          await this.eventRepo.save(event);
          eventsMoved++;

          // Notificar a los suscriptores que aún no hayan recibido el correo de finalización
          const sent = await this.notifySubscribersEventEnded(event);
          notificationsSent += sent;
        }
      } catch (err: any) {
        this.logger.error(`Error procesando evento finalizado ${event.uuid}: ${err?.message || err}`);
      }
    }

    return { eventsMovedToPast: eventsMoved, notificationsSent };
  }

  /**
   * Notifica a todos los usuarios suscritos a un evento que este ha concluido
   */
  async notifySubscribersEventEnded(event: EventEntity): Promise<number> {
    const pendingEndedSubs = await this.subscriptionRepo.find({
      where: {
        event: { index: event.index },
        notifiedEnded: false,
      },
      relations: { user: true, event: true },
    });

    if (!pendingEndedSubs || pendingEndedSubs.length === 0) {
      return 0;
    }

    let sent = 0;
    const batchSize = 10;

    for (let i = 0; i < pendingEndedSubs.length; i += batchSize) {
      const chunk = pendingEndedSubs.slice(i, i + batchSize);
      await Promise.allSettled(
        chunk.map(async (sub) => {
          if (!sub.user || !sub.user.email) return;

          try {
            await this.mailService.sendEventEndedNotification(sub.user.email, sub.user.name, {
              title: event.title,
              subtitle: event.subtitle,
              date: `${event.dateDay || ''} de ${event.dateMonth || ''} 2026`,
              time: event.time,
              location: `${event.location || ''}${event.city ? ' · ' + event.city : ''}`,
              description: event.description,
              imageUrl: event.imageUrl,
            });

            sub.notifiedEnded = true;
            sub.notifiedEndedAt = new Date();
            await this.subscriptionRepo.save(sub);
            sent++;
          } catch (err: any) {
            this.logger.error(`Error enviando notificación de finalización a ${sub.user?.email}: ${err?.message || err}`);
          }
        }),
      );
    }

    if (sent > 0) {
      this.logger.log(`[EVENTO FINALIZADO] ${sent} correos de conclusión enviados para "${event.title}".`);
    }

    return sent;
  }

  /**
   * Revisa todas las suscripciones no notificadas y envía el correo si falta 24 horas o menos para el evento
   */
  async checkAndSendUpcomingReminders(): Promise<{ checked: number; sent: number; errors: number }> {
    const pendingSubs = await this.subscriptionRepo.find({
      where: { notified24h: false },
      relations: {
        user: true,
        event: true,
      },
    });

    if (!pendingSubs || pendingSubs.length === 0) {
      return { checked: 0, sent: 0, errors: 0 };
    }

    const now = new Date();
    // Filtrar aquellas suscripciones que están en la ventana de <= 24 horas
    const eligibleSubs = pendingSubs.filter((sub) => {
      const event = sub.event;
      const user = sub.user;
      if (!event || !user || !user.email || event.status === 'past') return false;

      const eventStartDate = computeEventStartDate(event);
      const diffHours = (eventStartDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      return diffHours <= 24 && diffHours >= -4;
    });

    let sentCount = 0;
    let errorCount = 0;
    const batchSize = 10;

    for (let i = 0; i < eligibleSubs.length; i += batchSize) {
      const chunk = eligibleSubs.slice(i, i + batchSize);
      await Promise.allSettled(
        chunk.map(async (sub) => {
          try {
            const event = sub.event;
            const user = sub.user;

            await this.mailService.sendEvent24hReminder(user.email, user.name, {
              title: event.title,
              subtitle: event.subtitle,
              date: `${event.dateDay || ''} de ${event.dateMonth || ''} 2026`,
              time: event.time,
              location: `${event.location || ''}${event.city ? ' · ' + event.city : ''}`,
              description: event.description,
              imageUrl: event.imageUrl,
            });

            sub.notified24h = true;
            sub.notified24hAt = new Date();
            await this.subscriptionRepo.save(sub);
            sentCount++;
          } catch (err: any) {
            errorCount++;
            this.logger.error(`Error procesando recordatorio para suscripción ${sub.uuid}: ${err?.message || err}`);
          }
        }),
      );
    }

    if (sentCount > 0) {
      this.logger.log(`[RECORDATORIO 24H] Proceso completado: ${sentCount} correos de recordatorio enviados.`);
    }

    return { checked: pendingSubs.length, sent: sentCount, errors: errorCount };
  }
}
