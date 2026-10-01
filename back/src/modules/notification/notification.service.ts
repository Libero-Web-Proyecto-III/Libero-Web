import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, MoreThanOrEqual, Repository } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { UserEntity } from '../user/entities/user.entity';

export interface CreateCommentModerationNotificationDto {
  userIndex: number;
  moderatorIndex?: number;
  commentContent: string;
  moderationReason: string;
  publicationTitle?: string;
  publicationUuid?: string;
}

export interface CreatePqrResponseNotificationDto {
  userIndex: number;
  moderatorIndex?: number;
  pqrUuid: string;
  pqrSubject: string;
  pqrStatus: string;
  pqrResponse?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
  ) {}

  /**
   * Crea una notificación para el usuario cuyo comentario fue eliminado por moderación
   */
  async createCommentModerationNotification(
    data: CreateCommentModerationNotificationDto,
  ): Promise<NotificationEntity> {
    const now = new Date();
    // Expiración en 3 días exactos (72 horas)
    const expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const notification = this.notificationRepository.create({
      user: { index: data.userIndex } as UserEntity,
      moderator: data.moderatorIndex ? ({ index: data.moderatorIndex } as UserEntity) : null,
      type: 'comment_moderation',
      title: data.publicationTitle
        ? `Tu comentario en "${data.publicationTitle}" fue eliminado`
        : 'Tu comentario fue eliminado por un moderador',
      commentContent: data.commentContent,
      moderationReason: data.moderationReason,
      publicationTitle: data.publicationTitle || null,
      publicationUuid: data.publicationUuid || null,
      read: false,
      createdAt: now,
      expiresAt,
    });

    const saved = await this.notificationRepository.save(notification);
    this.logger.log(
      `Notificación de moderación creada para userIndex=${data.userIndex} (expira en 3 días: ${expiresAt.toISOString()})`,
    );
    return saved;
  }

  /**
   * Crea una notificación para el usuario cuando su PQR cambia de estado o recibe respuesta
   */
  async createPqrResponseNotification(
    data: CreatePqrResponseNotificationDto,
  ): Promise<NotificationEntity> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const statusMap: Record<string, string> = {
      pendiente: 'Pendiente',
      en_revision: 'En revisión',
      resuelto: 'Resuelto',
      rechazado: 'Rechazado',
    };
    const statusLabel = statusMap[data.pqrStatus] || data.pqrStatus;

    const notification = this.notificationRepository.create({
      user: { index: data.userIndex } as UserEntity,
      moderator: data.moderatorIndex ? ({ index: data.moderatorIndex } as UserEntity) : null,
      type: 'pqr_response',
      title: `Tu PQR "${data.pqrSubject}" ha sido actualizada (${statusLabel})`,
      commentContent: `Estado: ${statusLabel}`,
      moderationReason: data.pqrResponse ? data.pqrResponse : `Tu solicitud ha sido actualizada al estado ${statusLabel}.`,
      publicationTitle: data.pqrSubject,
      publicationUuid: data.pqrUuid,
      read: false,
      createdAt: now,
      expiresAt,
    });

    const saved = await this.notificationRepository.save(notification);
    this.logger.log(
      `Notificación de respuesta PQR creada para userIndex=${data.userIndex} (PQR ${data.pqrUuid}, expira: ${expiresAt.toISOString()})`,
    );
    return saved;
  }

  /**
   * Obtiene todas las notificaciones activas (menores a 3 días) para el usuario
   */
  async findForUser(userIndex: number): Promise<NotificationEntity[]> {
    const now = new Date();

    // Purgar en segundo plano las notificaciones expiradas (más de 3 días)
    await this.purgeExpired();

    return this.notificationRepository.find({
      where: [
        {
          user: { index: userIndex },
          expiresAt: MoreThanOrEqual(now),
        },
        {
          user: { index: userIndex },
          expiresAt: IsNull(),
        },
      ],
      relations: { moderator: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtiene el conteo de notificaciones no leídas y vigentes
   */
  async getUnreadCount(userIndex: number): Promise<number> {
    const now = new Date();
    return this.notificationRepository.count({
      where: [
        {
          user: { index: userIndex },
          read: false,
          expiresAt: MoreThanOrEqual(now),
        },
        {
          user: { index: userIndex },
          read: false,
          expiresAt: IsNull(),
        },
      ],
    });
  }

  /**
   * Marca una notificación específica como leída
   */
  async markAsRead(uuid: string, userIndex: number): Promise<NotificationEntity> {
    const notification = await this.notificationRepository.findOne({
      where: { uuid, user: { index: userIndex } },
    });
    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }
    notification.read = true;
    return this.notificationRepository.save(notification);
  }

  /**
   * Marca todas las notificaciones del usuario como leídas
   */
  async markAllAsRead(userIndex: number): Promise<{ updated: number }> {
    const unread = await this.notificationRepository.find({
      where: { user: { index: userIndex }, read: false },
    });
    if (unread.length === 0) {
      return { updated: 0 };
    }
    for (const item of unread) {
      item.read = true;
    }
    await this.notificationRepository.save(unread);
    return { updated: unread.length };
  }

  /**
   * Elimina manualmente una notificación por parte del usuario
   */
  async remove(uuid: string, userIndex: number): Promise<{ message: string }> {
    const notification = await this.notificationRepository.findOne({
      where: { uuid, user: { index: userIndex } },
    });
    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }
    await this.notificationRepository.remove(notification);
    return { message: 'Notificación eliminada' };
  }

  /**
   * Purga todas las notificaciones cuya fecha de expiración haya pasado (más de 3 días)
   */
  async purgeExpired(): Promise<number> {
    try {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      // Eliminar registros donde expiresAt < now o createdAt < 3 days ago
      const expired = await this.notificationRepository.find({
        where: [
          { expiresAt: LessThan(now) },
          { createdAt: LessThan(threeDaysAgo) },
        ],
      });

      if (expired.length > 0) {
        await this.notificationRepository.remove(expired);
        this.logger.log(`Se purgaron ${expired.length} notificaciones expiradas (antigüedad > 3 días)`);
      }
      return expired.length;
    } catch (err: any) {
      this.logger.warn(`Error al purgar notificaciones expiradas: ${err?.message || err}`);
      return 0;
    }
  }
}
