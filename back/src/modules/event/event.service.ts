import { BadRequestException, ForbiddenException, Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEntity } from './entities/event.entity';
import { EventSubscriptionEntity } from './entities/event-subscription.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { GetAllEventQueryDto } from './dto/get-event-query.dto';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { enumRol } from 'src/common/enums/rol.enum';
import { MailService } from '../mail/mail.service';
import { NotifyEventDto } from './dto/notify-event.dto';
import { computeEventStartDate, computeEventEndDate, EventReminderSchedulerService } from './event-reminder-scheduler.service';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(EventEntity)
    private readonly EventRepository: Repository<EventEntity>,
    @InjectRepository(EventSubscriptionEntity)
    private readonly subscriptionRepo: Repository<EventSubscriptionEntity>,
    private readonly mailService: MailService,
    @Inject(forwardRef(() => EventReminderSchedulerService))
    private readonly schedulerService: EventReminderSchedulerService,
  ) { }

  /**
   * Suscribe al usuario a un evento por UUID para recibir el recordatorio 24 horas antes
   */
  async subscribeUserToEvent(
    eventUuid: string,
    user: any,
  ): Promise<{ success: boolean; isSubscribed: boolean; notifiedImmediately: boolean; message: string }> {
    const targetEmail = user?.email;
    if (!targetEmail) {
      throw new BadRequestException('No se pudo identificar el correo electrónico del usuario para activar el recordatorio.');
    }

    const userId = user.index ?? user.id;
    if (!userId) {
      throw new BadRequestException('Identificador de usuario no válido.');
    }

    const event = await this.findOneBy.uuid(eventUuid);
    if (!event) {
      throw new NotFoundException('Evento no encontrado.');
    }

    // Verificar si ya existe una suscripción previa
    let subscription = await this.subscriptionRepo.findOne({
      where: {
        user: { index: userId },
        event: { index: event.index },
      },
      relations: { user: true, event: true },
    });

    // Comprobar si el evento comienza en menos de 24 horas para enviar inmediatamente ("notificar de golpe")
    const now = new Date();
    const eventStart = computeEventStartDate(event);
    const eventEnd = computeEventEndDate(event, eventStart);
    const diffHours = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Condición: Faltan 24 horas o menos para el inicio y el evento aún no ha concluido
    const shouldNotifyImmediately = diffHours <= 24 && now.getTime() < eventEnd.getTime();

    if (subscription) {
      // Si ya estaba suscrito pero aún no se le había notificado y ahora está a menos de 24h, notificar de golpe
      if (!subscription.notified24h && shouldNotifyImmediately) {
        await this.mailService.sendEvent24hReminder(targetEmail, user.name || user.username, {
          title: event.title,
          subtitle: event.subtitle,
          date: `${event.dateDay || ''} de ${event.dateMonth || ''} ${eventStart.getFullYear()}`,
          time: event.time,
          location: `${event.location || ''}${event.city ? ' · ' + event.city : ''}`,
          description: event.description,
          imageUrl: event.imageUrl,
        });

        subscription.notified24h = true;
        subscription.notified24hAt = new Date();
        await this.subscriptionRepo.save(subscription);

        return {
          success: true,
          isSubscribed: true,
          notifiedImmediately: true,
          message: '¡El evento inicia en menos de 24 horas! Te hemos notificado de golpe a tu correo electrónico.',
        };
      }

      return {
        success: true,
        isSubscribed: true,
        notifiedImmediately: subscription.notified24h,
        message: subscription.notified24h
          ? 'Ya habías recibido el recordatorio para este evento.'
          : 'Ya estás suscrito. Recibirás tu correo exactamente 24 horas antes de que inicie el evento.',
      };
    }

    let notifiedImmediately = false;

    if (shouldNotifyImmediately) {
      // El evento está a menos de 24 horas: notificar de golpe inmediatamente
      await this.mailService.sendEvent24hReminder(targetEmail, user.name || user.username, {
        title: event.title,
        subtitle: event.subtitle,
        date: `${event.dateDay || ''} de ${event.dateMonth || ''} ${eventStart.getFullYear()}`,
        time: event.time,
        location: `${event.location || ''}${event.city ? ' · ' + event.city : ''}`,
        description: event.description,
        imageUrl: event.imageUrl,
      });
      notifiedImmediately = true;
    }

    subscription = this.subscriptionRepo.create({
      user: { index: userId } as UserEntity,
      event: { index: event.index } as EventEntity,
      notified24h: notifiedImmediately,
      notified24hAt: notifiedImmediately ? new Date() : null,
      notifiedEnded: false,
      notifiedEndedAt: null,
    });
    await this.subscriptionRepo.save(subscription);

    return {
      success: true,
      isSubscribed: true,
      notifiedImmediately,
      message: notifiedImmediately
        ? '¡El evento inicia en menos de 24 horas! Te hemos notificado de golpe a tu correo electrónico.'
        : 'Recordatorio programado con éxito. Te enviaremos un correo con todos los detalles 24 horas antes de que inicie el evento.',
    };
  }

  /**
   * Cancela la suscripción a las notificaciones de un evento
   */
  async unsubscribeUserFromEvent(
    eventUuid: string,
    user: any,
  ): Promise<{ success: boolean; isSubscribed: boolean; message: string }> {
    const userId = user?.index ?? user?.id;
    if (!userId) {
      throw new BadRequestException('Identificador de usuario no válido.');
    }

    const event = await this.findOneBy.uuid(eventUuid);
    if (!event) {
      throw new NotFoundException('Evento no encontrado.');
    }

    await this.subscriptionRepo.delete({
      user: { index: userId },
      event: { index: event.index },
    });

    return {
      success: true,
      isSubscribed: false,
      message: 'Notificación desactivada para este evento.',
    };
  }

  /**
   * Obtiene la lista de UUIDs de eventos a los que el usuario está suscrito
   */
  async getUserSubscribedEventUuids(userId: number): Promise<string[]> {
    const subs = await this.subscriptionRepo.find({
      where: { user: { index: userId } },
      relations: { event: true },
    });
    return subs.filter((s) => s.event && s.event.uuid).map((s) => s.event.uuid);
  }

  /**
   * Método de compatibilidad anterior para /events/notify:
   * Intenta asociar el evento por título o registrar la suscripción
   */
  async notifyEvent(dto: NotifyEventDto, user: any): Promise<{ success: boolean; message: string }> {
    const targetEmail = user?.email;
    if (!targetEmail) {
      throw new BadRequestException('No se pudo identificar el correo electrónico del usuario.');
    }

    // Buscar si existe el evento en la DB por título
    const event = await this.EventRepository.findOne({
      where: { title: dto.title },
    });

    if (event) {
      const res = await this.subscribeUserToEvent(event.uuid, user);
      return {
        success: true,
        message: res.message,
      };
    }

    // Si no se encuentra en DB por título, enviar notificación directa
    return this.mailService.sendEventNotification(targetEmail, user.username || user.name, {
      title: dto.title,
      subtitle: dto.subtitle,
      date: dto.date,
      time: dto.time,
      location: dto.location,
      description: dto.description,
      imageUrl: dto.imageUrl,
    });
  }

  /**
   * Forzar ejecución manual del ciclo de recordatorios y finalización de eventos para pruebas
   */
  async triggerReminderCron(): Promise<any> {
    return this.schedulerService.runFullEventCycleCheck();
  }

  getLastEmailHtml(): string {
    return this.mailService.getLastEmailHtml();
  }

  getEmailLogs() {
    return this.mailService.getEmailLogs();
  }

  getEmailLogById(id: string) {
    return this.mailService.getEmailLogById(id);
  }

  getSampleEmailHtml(mode: any): string {
    return this.mailService.generateSampleEmail(mode);
  }

  async create(createEventDto: CreateEventDto, organizer?: any): Promise<EventEntity> {
    const startDate = createEventDto.startDate
      ? new Date(createEventDto.startDate)
      : computeEventStartDate(createEventDto);

    const endDate = createEventDto.endDate
      ? new Date(createEventDto.endDate)
      : computeEventEndDate(createEventDto, startDate);

    // Validación estricta: No permitir fechas u horas pasadas
    const now = new Date();
    if (startDate.getTime() < now.getTime()) {
      throw new BadRequestException(
        'No se pueden programar eventos con fechas u horas pasadas. La fecha y hora de inicio debe ser posterior al momento actual.',
      );
    }
    if (endDate.getTime() <= startDate.getTime()) {
      throw new BadRequestException(
        'La hora de finalización debe ser posterior a la hora de inicio.',
      );
    }

    const organizerId = organizer?.id || organizer?.index;

    // Si no se proporcionó time formateado pero sí startTime, construirlo automáticamente
    let timeFormatted = createEventDto.time;
    if (!timeFormatted && createEventDto.startTime) {
      timeFormatted = createEventDto.endTime
        ? `${createEventDto.startTime} - ${createEventDto.endTime} HRS`
        : `${createEventDto.startTime} HRS`;
    }

    const newEvent = this.EventRepository.create({
      ...createEventDto,
      time: timeFormatted,
      status: createEventDto.status || 'active',
      startDate,
      endDate,
      organizer: organizerId ? ({ index: organizerId } as UserEntity) : undefined,
    });
    return this.EventRepository.save(newEvent);
  }

  async findAll(query?: GetAllEventQueryDto): Promise<EventEntity[]> {
    // Procesar y mover automáticamente a 'past' cualquier evento cuya hora de término ya venció
    try {
      await this.schedulerService.checkAndProcessEndedEvents();
    } catch {}

    const where: any = {};
    if (query?.status) where.status = query.status;

    return await this.EventRepository.find({
      where,
      relations: { organizer: { rol: true } },
      order: { createdAt: 'DESC' },
    });
  }

  findOneBy = {
    uuid: async (uuid: string): Promise<EventEntity> => {
      const event = await this.EventRepository.findOne({
        where: { uuid },
        relations: { organizer: { rol: true } },
      });

      if (!event) throw new NotFoundException('No se encontró este evento por UUID');
      return event;
    },
  };

  async update(uuid: string, updateEventDto: UpdateEventDto): Promise<EventEntity> {
    const event = await this.findOneBy.uuid(uuid);
    const wasActive = event.status === 'active';
    const updated = this.EventRepository.merge(event, updateEventDto);

    if (updateEventDto.startDate) {
      updated.startDate = new Date(updateEventDto.startDate);
    } else if (updateEventDto.dateDay || updateEventDto.dateMonth || updateEventDto.time || updateEventDto.startTime) {
      updated.startDate = computeEventStartDate(updated);
    }

    if (updateEventDto.endDate) {
      updated.endDate = new Date(updateEventDto.endDate);
    } else if (updateEventDto.endTime) {
      updated.endDate = computeEventEndDate(updated, updated.startDate);
    }

    if (!updated.time && (updated.startTime || updated.endTime)) {
      updated.time = updated.endTime
        ? `${updated.startTime} - ${updated.endTime} HRS`
        : `${updated.startTime} HRS`;
    }

    const saved = await this.EventRepository.save(updated);

    // Si el evento fue movido a 'past' y estaba 'active', notificar su conclusión a los suscriptores
    if (wasActive && saved.status === 'past') {
      await this.schedulerService.notifySubscribersEventEnded(saved);
    }

    return saved;
  }

  async remove(uuid: string, requester?: { role: string }): Promise<{ message: string; cancelledNotificationsSent: number }> {
    const event = await this.findOneBy.uuid(uuid);

    // 1. Buscar todas las suscripciones activas vinculadas a este evento
    const subscriptions = await this.subscriptionRepo.find({
      where: { event: { index: event.index } },
      relations: { user: true, event: true },
    });

    let cancelledNotificationsSent = 0;
    const batchSize = 10;

    // 2. Enviar correos en lotes paralelos (chunks) a los usuarios suscritos avisando que el evento ha sido cancelado
    for (let i = 0; i < subscriptions.length; i += batchSize) {
      const chunk = subscriptions.slice(i, i + batchSize);
      await Promise.allSettled(
        chunk.map(async (sub) => {
          if (!sub.user?.email) return;
          try {
            await this.mailService.sendEventCancellationNotification(sub.user.email, sub.user.name || 'Usuario', {
              title: event.title,
              subtitle: event.subtitle,
              date: `${event.dateDay || ''} de ${event.dateMonth || ''} 2026`,
              time: event.time,
              location: `${event.location || ''}${event.city ? ' · ' + event.city : ''}`,
              description: event.description,
              imageUrl: event.imageUrl,
            });
            cancelledNotificationsSent++;
          } catch (err: any) {
            // Mantener resiliencia si un envío individual falla
          }
        }),
      );
    }

    // 3. Eliminar suscripciones asociadas
    await this.subscriptionRepo.delete({ event: { index: event.index } });

    // 4. Eliminar el evento
    await this.EventRepository.remove(event);

    return {
      message: `Evento "${event.title}" eliminado correctamente. Se enviaron ${cancelledNotificationsSent} notificaciones de cancelación a usuarios suscritos.`,
      cancelledNotificationsSent,
    };
  }

  /**
   * Obtiene la lista completa de usuarios con notificación activa para un evento específico
   */
  async getEventSubscribers(eventUuid: string): Promise<{
    event: { uuid: string; title: string; status: string; dateDay: string; dateMonth: string; time: string };
    totalSubscribers: number;
    subscribers: any[];
  }> {
    const event = await this.findOneBy.uuid(eventUuid);
    if (!event) {
      throw new NotFoundException('Evento no encontrado.');
    }

    const subscriptions = await this.subscriptionRepo.find({
      where: { event: { index: event.index } },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });

    const subscribers = subscriptions.map((sub) => ({
      id: sub.user?.index,
      name: sub.user?.name || 'Usuario',
      email: sub.user?.email || '',
      avatar: sub.user?.avatar || null,
      role: (sub.user?.rol as any)?.name || 'user',
      notified24h: sub.notified24h,
      notified24hAt: sub.notified24hAt,
      notifiedEnded: sub.notifiedEnded,
      notifiedEndedAt: sub.notifiedEndedAt,
      subscribedAt: sub.createdAt,
    }));

    return {
      event: {
        uuid: event.uuid,
        title: event.title,
        status: event.status,
        dateDay: event.dateDay,
        dateMonth: event.dateMonth,
        time: event.time,
      },
      totalSubscribers: subscribers.length,
      subscribers,
    };
  }

  /**
   * Obtiene todos los eventos con su lista y conteo de suscriptores para auditoría
   */
  async getAllEventsWithSubscribersSummary(): Promise<any[]> {
    const events = await this.EventRepository.find({
      order: { index: 'DESC' },
    });

    const result: any[] = [];
    for (const event of events) {
      const subscriptions = await this.subscriptionRepo.find({
        where: { event: { index: event.index } },
        relations: { user: true },
      });

      result.push({
        uuid: event.uuid,
        title: event.title,
        status: event.status,
        date: `${event.dateDay || ''} de ${event.dateMonth || ''}`,
        time: event.time,
        subscriberCount: subscriptions.length,
        subscribers: subscriptions.map((s) => ({
          name: s.user?.name || 'Usuario',
          email: s.user?.email,
          notified24h: s.notified24h,
          notifiedEnded: s.notifiedEnded,
          subscribedAt: s.createdAt,
        })),
      });
    }

    return result;
  }
}