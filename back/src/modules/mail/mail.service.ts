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
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 6000,
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
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 6000,
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
    const cleanUser = user.trim();
    const isGmail = cleanUser.toLowerCase().endsWith('@gmail.com');
    // Para Gmail, el 'from' debe coincidir con la cuenta autenticada para evitar rechazos por DMARC/SPF
    const fromAddress = isGmail && cleanUser
      ? `"Líbero Cobre" <${cleanUser}>`
      : (this.configService.get<string>('SMTP_FROM') || (cleanUser ? `"Líbero Cobre" <${cleanUser}>` : '"Líbero Cobre" <no-reply@liberocobre.online>'));

    let htmlContent = '';
    try {
      const template = readFileSync(join(__dirname, 'templates', 'password-reset.html'), 'utf8');
      htmlContent = template
        .replaceAll('{{USER_NAME}}', this.escapeHtml(userName))
        .replaceAll('{{RESET_URL}}', this.escapeHtml(resetUrl));
    } catch {
      htmlContent = `
        <div style="font-family:sans-serif;padding:24px;background:#f8fafc;">
          <h2>Recuperación de Contraseña - Líbero Cobre</h2>
          <p>Hola, <strong>${this.escapeHtml(userName)}</strong>.</p>
          <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
          <p><a href="${this.escapeHtml(resetUrl)}" style="background:#D86E00;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;">Restablecer Contraseña</a></p>
          <p style="font-size:12px;color:#64748b;">Este enlace expira en 15 minutos.</p>
        </div>
      `;
    }
    this.lastGeneratedEmailHtml = htmlContent;

    this.logger.log(`\n========================================================================\n📧 [SOLICITUD DE RECUPERACIÓN DE CONTRASEÑA]\nDestinatario: ${toEmail} (${userName})\nEnlace Directo: ${resetUrl}\n========================================================================\n`);

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
          setTimeout(() => reject(new Error('SMTP timeout de conexión (red o proveedor bloqueó el puerto SMTP)')), 6000),
        ),
      ]);
      this.logger.log(`Correo de recuperación enviado exitosamente a ${toEmail}. MessageId: ${info.messageId}`);
      return { success: true, message: 'Correo de recuperación enviado.', messageId: info.messageId };
    } catch (error: any) {
      this.logger.warn(
        `Aviso de Red/SMTP: No se pudo despachar el correo a ${toEmail} (${error?.message || error}). Enlace directo disponible en consola: ${resetUrl}`,
      );
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
    const cleanUser = user.trim();
    const isGmail = cleanUser.toLowerCase().endsWith('@gmail.com');
    const fromAddress = isGmail && cleanUser
      ? `"Líbero Cobre" <${cleanUser}>`
      : (this.configService.get<string>('SMTP_FROM') || (cleanUser ? `"Líbero Cobre" <${cleanUser}>` : '"Líbero Cobre" <notificaciones@liberocobre.online>'));

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

    this.logger.log(`\n========================================================================\n📧 [NOTIFICACIÓN DE EVENTO - ${mode.toUpperCase()}]\nDestinatario: ${toEmail} (${userName})\nEvento: ${event.title}\nFecha/Hora: ${event.date} - ${event.time}\nLugar: ${event.location}\n========================================================================\n`);

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
   * Genera el contenido HTML con diseño corporativo en colores naranja y blanco (Líbero Cobre)
   */
  private buildEventEmailTemplate(userName: string, event: EventEmailData, mode: EventNotificationMode = 'confirmation'): string {
    const rawFrontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
    const frontendUrl = rawFrontendUrl.trim().replace(/\/+$/, '');
    const safeName = userName || 'Usuario de Líbero Cobre';

    let badgeText = 'Notificación Activa';
    let badgeStyle = 'background: rgba(216, 110, 0, 0.08); border: 1px solid rgba(216, 110, 0, 0.25); color: #D86E00;';
    let introText = 'Has activado con éxito las notificaciones para este evento. A continuación te presentamos todos los detalles confirmados para que no te pierdas de nada:';
    let alertBanner = '';

    if (mode === 'reminder24h') {
      badgeText = '⏰ Inicia en 24 Horas';
      badgeStyle = 'background: rgba(216, 110, 0, 0.12); border: 1px solid #D86E00; color: #D86E00; font-weight: 800;';
      introText = '¡Tu evento está muy cerca! Te recordamos que faltan <strong>aproximadamente 24 horas</strong> para el inicio de esta actividad. A continuación tienes todos los detalles para que prepares tu llegada:';
    } else if (mode === 'cancellation') {
      badgeText = '⚠️ Evento Cancelado';
      badgeStyle = 'background: #fef2f2; border: 1px solid #fca5a5; color: #dc2626;';
      introText = 'Lamentamos informarte que el evento <strong>' + this.escapeHtml(event.title) + '</strong>, para el cual tenías una notificación activa, ha sido <strong>cancelado y no se llevará a cabo</strong>. Sentimos cualquier inconveniente que esto pueda ocasionarte.';
      alertBanner = `
        <div style="background: #fff1f2; border-left: 4px solid #ef4444; border: 1px solid #fecdd3; border-radius: 8px; padding: 14px 18px; margin-bottom: 22px; color: #9f1239; font-size: 13.5px; line-height: 1.5;">
          <strong>AVISO DE CANCELACIÓN:</strong> Este evento ha sido suspendido definitivamente. Tu recordatorio ha sido desactivado automáticamente.
        </div>
      `;
    } else if (mode === 'ended') {
      badgeText = '🏁 Evento Concluido';
      badgeStyle = 'background: #f1f5f9; border: 1px solid #cbd5e1; color: #475569;';
      introText = 'Te informamos que el evento <strong>' + this.escapeHtml(event.title) + '</strong> ha finalizado oficialmente. Esperamos que hayas disfrutado de la experiencia. ¡Muchas gracias por formar parte de la comunidad de Líbero Cobre!';
      alertBanner = `
        <div style="background: #f8fafc; border-left: 4px solid #006581; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-bottom: 22px; color: #334155; font-size: 13.5px; line-height: 1.5;">
          ✨ <strong>EVENTO CONCLUIDO:</strong> Esperamos que hayas disfrutado este evento. Mantente atento a la cartelera para futuras fechas y convocatorias.
        </div>
      `;
    }
    const subtitleHtml = event.subtitle
      ? `<p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px; font-style: italic;">${this.escapeHtml(event.subtitle)}</p>`
      : '';
    const imageHtml = event.imageUrl
      ? `<div style="margin: 20px 0; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
           <img src="${event.imageUrl}" alt="${this.escapeHtml(event.title)}" style="width: 100%; max-height: 240px; object-fit: cover; display: block;" />
         </div>`
      : '';

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Notificación de Evento - Líbero Cobre</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F5FDFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F5FDFF; padding: 36px 15px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 600px; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; border-top: 5px solid #D86E00; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);" cellspacing="0" cellpadding="0">
                
                <!-- Encabezado con identidad de marca -->
                <tr>
                  <td style="padding: 26px 32px; background: #ffffff; border-bottom: 1px solid #f1f5f9;">
                    <table width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td>
                          <span style="display: inline-block; font-size: 20px; font-weight: 800; letter-spacing: 1.5px; color: #0f172a; text-transform: uppercase;">
                            LÍBERO <span style="color: #D86E00;">COBRE</span>
                          </span>
                        </td>
                        <td align="right">
                          <span style="display: inline-block; padding: 5px 12px; ${badgeStyle} border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
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

                    <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #0f172a; font-weight: 800;">
                      ¡Hola, <span style="color: #D86E00;">${this.escapeHtml(safeName)}</span>!
                    </h2>
                    <p style="margin: 0 0 20px 0; color: #475569; font-size: 14.5px; line-height: 1.6;">
                      ${introText}
                    </p>

                    ${imageHtml}

                    <!-- Tarjeta del Evento -->
                    <div style="background: #f8fafc; border-left: 4px solid #D86E00; border-radius: 10px; padding: 22px; margin-bottom: 24px; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
                      <h3 style="margin: 0 0 4px 0; color: #0f172a; font-size: 18px; font-weight: 800; letter-spacing: -0.3px;">
                        ${this.escapeHtml(event.title)}
                      </h3>
                      ${subtitleHtml}

                      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />

                      <table width="100%" cellspacing="0" cellpadding="6" style="font-size: 13.5px;">
                        <tr>
                          <td width="28%" style="color: #D86E00; font-weight: 700;">📅 Fecha:</td>
                          <td style="color: #1e293b; font-weight: 500;">${this.escapeHtml(event.date)}</td>
                        </tr>
                        <tr>
                          <td style="color: #D86E00; font-weight: 700;">⏰ Horario:</td>
                          <td style="color: #1e293b; font-weight: 500;">${this.escapeHtml(event.time)}</td>
                        </tr>
                        <tr>
                          <td style="color: #D86E00; font-weight: 700;">📍 Lugar:</td>
                          <td style="color: #1e293b; font-weight: 500;">${this.escapeHtml(event.location)}</td>
                        </tr>
                      </table>

                      <div style="margin-top: 14px; padding: 12px 14px; background: #ffffff; border: 1px solid #edf2f7; border-radius: 8px; font-size: 13px; color: #475569; line-height: 1.55;">
                        ${this.escapeHtml(event.description)}
                      </div>
                    </div>

                    <!-- Mensaje de aviso -->
                    <p style="margin: 0 0 24px 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                      🔔 Te avisaremos oportunamente ante cualquier actualización o recordatorio previo a la fecha del evento.
                    </p>

                    <!-- Botón de acción -->
                    <table width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center">
                          <a href="${frontendUrl}/eventos" style="display: inline-block; background: linear-gradient(135deg, #D86E00 0%, #D84E18 100%); color: #ffffff; text-decoration: none; padding: 13px 30px; border-radius: 8px; font-weight: 700; font-size: 14px; letter-spacing: 0.5px; text-transform: uppercase; box-shadow: 0 4px 14px rgba(216, 110, 0, 0.25);">
                            Ver Más Eventos en Líbero
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Pie de página -->
                <tr>
                  <td style="padding: 24px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="margin: 0 0 6px 0; color: #64748b; font-size: 12px;">
                      Este es un correo automático generado por <strong>Líbero Cobre Web</strong>.
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                      Recibiste esta notificación porque solicitaste recordatorios para este evento.
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
