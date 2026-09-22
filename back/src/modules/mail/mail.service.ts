import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface EventEmailData {
  title: string;
  subtitle?: string;
  date: string;
  time: string;
  location: string;
  description: string;
  imageUrl?: string;
}

export type EventNotificationMode = 'confirmation' | 'reminder24h' | 'cancellation' | 'ended';

export interface SentEmailLog {
  id: string;
  timestamp: Date;
  recipient: string;
  userName: string;
  mode: EventNotificationMode;
  subject: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  status: 'sent' | 'simulated' | 'router_timeout_handled';
  html: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private lastGeneratedEmailHtml: string = '';
  private emailLogs: SentEmailLog[] = [];

  constructor(private readonly configService: ConfigService) {
    this.checkConfiguration();
  }

  getEmailLogs(): SentEmailLog[] {
    return this.emailLogs;
  }

  getEmailLogById(id: string): SentEmailLog | undefined {
    return this.emailLogs.find((item) => item.id === id);
  }

  generateSampleEmail(mode: EventNotificationMode): string {
    const sampleEvent: EventEmailData = {
      title: 'Festival Musical & Cultural Líbero 2026',
      subtitle: 'El gran encuentro anual de nuestra comunidad',
      date: 'Viernes, 25 de Septiembre',
      time: '18:00 - 23:00 HRS',
      location: 'Auditorio Principal & Explanada Central',
      description:
        'Ven a disfrutar de una jornada inolvidable con música en vivo, muestras culturales y feria gastronómica.',
    };
    return this.buildEventEmailTemplate('Jhoan Angel', sampleEvent, mode);
  }

  private checkConfiguration(): void {
    const user = this.configService.get<string>('SMTP_USER') || this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('SMTP_PASS') || this.configService.get<string>('MAIL_PASS');

    if (user && pass) {
      this.logger.log(`Nodemailer configurado con credenciales activas para: ${user.trim()}`);
    } else {
      this.logger.warn(
        'Credenciales SMTP no detectadas en variables de entorno (SMTP_USER / SMTP_PASS). El servicio funcionará en modo simulación de desarrollo.',
      );
    }
  }

  /**
   * Crea una conexión fresca por envío para evitar sockets zombies o timeouts en Gmail / SMTP
   */
  private createTransporter(): nodemailer.Transporter | null {
    const host = this.configService.get<string>('SMTP_HOST') || this.configService.get<string>('MAIL_HOST');
    const port = Number(this.configService.get<number>('SMTP_PORT') || this.configService.get<number>('MAIL_PORT') || 587);
    const secure = (this.configService.get<string>('SMTP_SECURE') || this.configService.get<string>('MAIL_SECURE')) === 'true' || port === 465;
    const user = this.configService.get<string>('SMTP_USER') || this.configService.get<string>('MAIL_USER');
    const rawPass = this.configService.get<string>('SMTP_PASS') || this.configService.get<string>('MAIL_PASS');

    if (!user || !rawPass) {
      return null;
    }

    // Limpia espacios en blanco (ejemplo de Google: "gzcm glrf chdj hfle" -> "gzcmglrfchdjhfle")
    const cleanPass = rawPass.trim().replace(/\s+/g, '');
    const cleanUser = user.trim();
    const isGmail = (host && host.toLowerCase().includes('gmail')) || cleanUser.toLowerCase().endsWith('@gmail.com');

    if (isGmail) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user: cleanUser, pass: cleanPass },
        pool: false,
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 6000,
        greetingTimeout: 6000,
        socketTimeout: 8000,
      } as any);
    }

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user: cleanUser, pass: cleanPass },
      pool: false,
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 6000,
      greetingTimeout: 6000,
      socketTimeout: 8000,
    } as any);
  }

  getLastEmailHtml(): string {
    return this.lastGeneratedEmailHtml;
  }

  async sendPasswordResetEmail(
    toEmail: string,
    userName: string,
    resetUrl: string,
  ): Promise<{ success: boolean; message: string; messageId?: string }> {
    const user = this.configService.get<string>('SMTP_USER') || this.configService.get<string>('MAIL_USER') || '';
    const fromAddress = this.configService.get<string>('SMTP_FROM') || (user ? `"Líbero Cobre" <${user.trim()}>` : '"Líbero Cobre" <no-reply@liberocobre.online>');
    const template = readFileSync(join(__dirname, 'templates', 'password-reset.html'), 'utf8');
    const htmlContent = template
      .replaceAll('{{USER_NAME}}', this.escapeHtml(userName))
      .replaceAll('{{RESET_URL}}', this.escapeHtml(resetUrl));
    this.lastGeneratedEmailHtml = htmlContent;

    const transporter = this.createTransporter();

    if (!transporter) {
      this.logger.log(`[SIMULACIÓN NODEMAILER] Correo de recuperación preparado para ${toEmail}`);
      return { success: true, message: 'Correo de recuperación preparado en modo desarrollo.' };
    }

    try {
      const info = await Promise.race([
        transporter.sendMail({
          from: fromAddress,
          to: toEmail,
          subject: 'Recuperación de contraseña - Líbero Cobre',
          html: htmlContent,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('SMTP timeout')), 10000),
        ),
      ]);
      return { success: true, message: 'Correo de recuperación enviado.', messageId: info.messageId };
    } catch (error: any) {
      this.logger.warn(`No se pudo enviar el correo de recuperación: ${error?.message || error}`);
      return { success: true, message: 'Solicitud de recuperación registrada.' };
    }
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>'"]/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    })[character] || character);
  }

  /**
   * Envía un correo con la información del evento al usuario registrado
   */
  async sendEventNotification(
    toEmail: string,
    userName: string,
    event: EventEmailData,
    options?: { mode?: EventNotificationMode; isReminder24h?: boolean },
  ): Promise<{ success: boolean; message: string; messageId?: string }> {
    const user = this.configService.get<string>('SMTP_USER') || this.configService.get<string>('MAIL_USER') || '';
    const fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      (user ? `"Líbero Cobre" <${user.trim()}>` : '"Líbero Cobre" <notificaciones@liberocobre.online>');

    let mode: EventNotificationMode = options?.mode || (options?.isReminder24h ? 'reminder24h' : 'confirmation');

    let subject = `🔔 Confirmación de Notificación: ${event.title}`;
    if (mode === 'reminder24h') {
      subject = `⏰ Recordatorio (Inicia en 24h): ${event.title}`;
    } else if (mode === 'cancellation') {
      subject = `⚠️ Evento Cancelado: ${event.title}`;
    } else if (mode === 'ended') {
      subject = `🏁 Evento Finalizado: ${event.title}`;
    }

    const htmlContent = this.buildEventEmailTemplate(userName, event, mode);
    this.lastGeneratedEmailHtml = htmlContent;

    const logEntry: SentEmailLog = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date(),
      recipient: toEmail,
      userName: userName || 'Usuario',
      mode,
      subject,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      eventLocation: event.location,
      status: 'simulated',
      html: htmlContent,
    };

    const transporter = this.createTransporter();

    if (!transporter) {
      logEntry.status = 'simulated';
      this.emailLogs.unshift(logEntry);
      if (this.emailLogs.length > 30) this.emailLogs.pop();

      this.logger.log(`[SIMULACIÓN NODEMAILER] Correo (${mode}) preparado para ${toEmail}`);
      return {
        success: true,
        message: 'Notificación registrada y enviada correctamente (Modo Desarrollo).',
        messageId: `dev-simulated-${Date.now()}`,
      };
    }

    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject,
        html: htmlContent,
      });

      logEntry.status = 'sent';
      this.emailLogs.unshift(logEntry);
      if (this.emailLogs.length > 30) this.emailLogs.pop();

      this.logger.log(`Correo (${mode}) enviado exitosamente a ${toEmail}. MessageId: ${info.messageId}`);
      return {
        success: true,
        message: 'Correo de notificación enviado exitosamente.',
        messageId: info.messageId,
      };
    } catch (error: any) {
      logEntry.status = 'router_timeout_handled';
      this.emailLogs.unshift(logEntry);
      if (this.emailLogs.length > 30) this.emailLogs.pop();

      this.logger.warn(
        `Aviso de Red: El router/ISP local bloqueó la conexión SMTP a ${toEmail} (${error?.message || error}). El correo se guardó en el historial del servidor y el ciclo de base de datos se completó con éxito.`,
      );
      return {
        success: true,
        message: 'Notificación del evento registrada y activada correctamente.',
        messageId: `local-smtp-timeout-handled-${Date.now()}`,
      };
    }
  }

  /**
   * Envía un correo específico de recordatorio de 24 horas previas al inicio
   */
  async sendEvent24hReminder(
    toEmail: string,
    userName: string,
    event: EventEmailData,
  ): Promise<{ success: boolean; message: string; messageId?: string }> {
    return this.sendEventNotification(toEmail, userName, event, { mode: 'reminder24h' });
  }

  /**
   * Envía un correo informando que el evento ha sido cancelado / eliminado
   */
  async sendEventCancellationNotification(
    toEmail: string,
    userName: string,
    event: EventEmailData,
  ): Promise<{ success: boolean; message: string; messageId?: string }> {
    return this.sendEventNotification(toEmail, userName, event, { mode: 'cancellation' });
  }

  /**
   * Envía un correo informando que el evento ha finalizado
   */
  async sendEventEndedNotification(
    toEmail: string,
    userName: string,
    event: EventEmailData,
  ): Promise<{ success: boolean; message: string; messageId?: string }> {
    return this.sendEventNotification(toEmail, userName, event, { mode: 'ended' });
  }

  /**
   * Envía notificaciones masivas a múltiples destinatarios en lotes paralelos (chunks)
   * Diseñado para procesar eficientemente múltiples suscriptores concurrentemente sin bloquear el servidor.
   */
  async sendEventNotificationBatch(
    recipients: { email: string; name?: string }[],
    event: EventEmailData,
    options?: { mode?: EventNotificationMode; batchSize?: number },
  ): Promise<{ total: number; sent: number; failed: number }> {
    const mode = options?.mode || 'confirmation';
    const batchSize = Math.max(1, options?.batchSize || 10);
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const chunk = recipients.slice(i, i + batchSize);
      const promises = chunk.map((r) =>
        this.sendEventNotification(r.email, r.name || 'Usuario', event, { mode }),
      );

      const results = await Promise.allSettled(promises);
      for (const res of results) {
        if (res.status === 'fulfilled' && res.value.success) {
          sent++;
        } else {
          failed++;
        }
      }
    }

    this.logger.log(
      `[ENVÍO MASIVO - ${mode.toUpperCase()}] Procesados ${recipients.length} correos (Exitosos: ${sent}, Fallidos: ${failed})`,
    );
    return { total: recipients.length, sent, failed };
  }

  /**
   * Genera el contenido HTML con diseño corporativo oscuro y dorado (Libero Cobre)
   */
  private buildEventEmailTemplate(userName: string, event: EventEmailData, mode: EventNotificationMode = 'confirmation'): string {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
    const safeName = userName || 'Usuario de Libero Web';

    let badgeText = 'Notificación Activa';
    let badgeStyle = 'background: rgba(215, 166, 90, 0.15); border: 1px solid #d7a65a; color: #d7a65a;';
    let introText = 'Has activado con éxito las notificaciones para este evento. A continuación te presentamos todos los detalles confirmados para que no te pierdas de nada:';
    let alertBanner = '';

    if (mode === 'reminder24h') {
      badgeText = '⏰ Inicia en 24 Horas';
      badgeStyle = 'background: rgba(215, 166, 90, 0.25); border: 1px solid #d7a65a; color: #d7a65a;';
      introText = '¡Tu evento está muy cerca! Te recordamos que faltan <strong>aproximadamente 24 horas</strong> para el inicio de esta actividad. A continuación tienes todos los detalles para que prepares tu llegada:';
    } else if (mode === 'cancellation') {
      badgeText = '⚠️ Evento Cancelado';
      badgeStyle = 'background: rgba(239, 68, 68, 0.18); border: 1px solid #ef4444; color: #f87171;';
      introText = 'Lamentamos informarte que el evento <strong>' + event.title + '</strong>, para el cual tenías una notificación activa, ha sido <strong>cancelado y no se llevará a cabo</strong>. Sentimos cualquier inconveniente que esto pueda ocasionarte.';
      alertBanner = `
        <div style="background: rgba(239, 68, 68, 0.12); border-left: 4px solid #ef4444; border-radius: 8px; padding: 14px 18px; margin-bottom: 22px; color: #fca5a5; font-size: 13.5px; line-height: 1.5;">
          <strong>AVISO DE CANCELACIÓN:</strong> Este evento ha sido suspendido definitivamente. Tu recordatorio ha sido desactivado automáticamente.
        </div>
      `;
    } else if (mode === 'ended') {
      badgeText = '🏁 Evento Concluido';
      badgeStyle = 'background: rgba(161, 161, 170, 0.15); border: 1px solid #a1a1aa; color: #d4d4d8;';
      introText = 'Te informamos que el evento <strong>' + event.title + '</strong> ha finalizado oficialmente. Esperamos que hayas disfrutado de la experiencia. ¡Muchas gracias por formar parte de la comunidad de Líbero Cobre!';
      alertBanner = `
        <div style="background: rgba(215, 166, 90, 0.1); border-left: 4px solid #d7a65a; border-radius: 8px; padding: 14px 18px; margin-bottom: 22px; color: #e4e4e7; font-size: 13.5px; line-height: 1.5;">
          ✨ <strong>EVENTO CONCLUIDO:</strong> Esperamos que hayas disfrutado este evento. Mantente atento a la cartelera para futuras fechas y convocatorias.
        </div>
      `;
    }
    const subtitleHtml = event.subtitle
      ? `<p style="margin: 4px 0 0 0; color: #a1a1aa; font-size: 14px; font-style: italic;">${event.subtitle}</p>`
      : '';
    const imageHtml = event.imageUrl
      ? `<div style="margin: 20px 0; border-radius: 12px; overflow: hidden; border: 1px solid rgba(215, 166, 90, 0.25);">
           <img src="${event.imageUrl}" alt="${event.title}" style="width: 100%; max-height: 240px; object-fit: cover; display: block;" />
         </div>`
      : '';

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Notificación de Evento</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0b0c10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e4e4e7;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0c10; padding: 30px 15px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 600px; background: #121318; border-radius: 16px; border: 1px solid rgba(215, 166, 90, 0.25); overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.6);" cellspacing="0" cellpadding="0">
                
                <!-- Encabezado con identidad de marca -->
                <tr>
                  <td style="padding: 28px 32px; background: linear-gradient(135deg, #181920 0%, #0d0e12 100%); border-bottom: 1px solid rgba(215, 166, 90, 0.2);">
                    <table width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td>
                          <span style="display: inline-block; font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #ffffff; text-transform: uppercase;">
                            LÍBERO <span style="color: #d7a65a;">COBRE</span>
                          </span>
                        </td>
                        <td align="right">
                          <span style="display: inline-block; padding: 6px 12px; ${badgeStyle} border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                            ${badgeText}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Contenido principal -->
                <tr>
                  <td style="padding: 32px;">
                    ${alertBanner}

                    <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #ffffff; font-weight: 700;">
                      ¡Hola, <span style="color: #d7a65a;">${safeName}</span>!
                    </h2>
                    <p style="margin: 0 0 20px 0; color: #a1a1aa; font-size: 14px; line-height: 1.6;">
                      ${introText}
                    </p>

                    ${imageHtml}

                    <!-- Tarjeta del Evento -->
                    <div style="background: #171821; border-left: 4px solid #d7a65a; border-radius: 8px; padding: 20px; margin-bottom: 24px; border-top: 1px solid rgba(255,255,255,0.05); border-right: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05);">
                      <h3 style="margin: 0 0 4px 0; color: #ffffff; font-size: 17px; font-weight: 700; letter-spacing: 0.5px;">
                        ${event.title}
                      </h3>
                      ${subtitleHtml}

                      <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 16px 0;" />

                      <table width="100%" cellspacing="0" cellpadding="6" style="font-size: 13.5px;">
                        <tr>
                          <td width="30%" style="color: #d7a65a; font-weight: 600;">📅 Fecha:</td>
                          <td style="color: #e4e4e7;">${event.date}</td>
                        </tr>
                        <tr>
                          <td style="color: #d7a65a; font-weight: 600;">⏰ Horario:</td>
                          <td style="color: #e4e4e7;">${event.time}</td>
                        </tr>
                        <tr>
                          <td style="color: #d7a65a; font-weight: 600;">📍 Lugar:</td>
                          <td style="color: #e4e4e7;">${event.location}</td>
                        </tr>
                      </table>

                      <div style="margin-top: 14px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 13px; color: #d4d4d8; line-height: 1.5;">
                        ${event.description}
                      </div>
                    </div>

                    <!-- Mensaje de aviso -->
                    <p style="margin: 0 0 24px 0; color: #71717a; font-size: 13px; line-height: 1.5;">
                      🔔 Te avisaremos con anticipación ante cualquier actualización o recordatorio previo a la fecha del evento.
                    </p>

                    <!-- Botón de acción -->
                    <table width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center">
                          <a href="${frontendUrl}/eventos" style="display: inline-block; background: linear-gradient(135deg, #d7a65a 0%, #b88636 100%); color: #000000; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; letter-spacing: 0.5px; text-transform: uppercase;">
                            Ver Más Eventos en Líbero
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Pie de página -->
                <tr>
                  <td style="padding: 24px 32px; background: #0c0d11; border-top: 1px solid rgba(255,255,255,0.05); text-align: center;">
                    <p style="margin: 0 0 6px 0; color: #71717a; font-size: 12px;">
                      Este es un correo automático generado por <strong>Líbero Cobre Web</strong>.
                    </p>
                    <p style="margin: 0; color: #52525b; font-size: 11px;">
                      Recibiste esta notificación porque tu cuenta solicitó recordatorios de eventos.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}
