import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { environment } from '../../../environments/environment';

export interface NotificationItem {
  index?: number;
  uuid: string;
  type: string;
  title: string;
  commentContent: string;
  moderationReason: string;
  publicationTitle?: string | null;
  publicationUuid?: string | null;
  read: boolean;
  createdAt: string | Date;
  expiresAt?: string | Date;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  readonly notifications = signal<NotificationItem[]>([]);
  readonly loading = signal(false);

  readonly unreadCount = computed(() => {
    return this.notifications().filter(n => !n.read).length;
  });

  private pollingInterval: any = null;

  constructor() {
    // Si el usuario ya está autenticado al iniciar, cargar notificaciones
    if (this.authService.isLoggedIn()) {
      this.loadNotifications();
    }

    // Polling ligero cada 15 segundos para recibir notificaciones en tiempo real
    if (typeof window !== 'undefined') {
      this.pollingInterval = setInterval(() => {
        if (this.authService.isLoggedIn()) {
          this.loadNotifications(false);
        }
      }, 15000);
    }
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  /**
   * Carga todas las notificaciones activas del usuario (menores a 3 días)
   */
  loadNotifications(showLoading = true): void {
    if (!this.authService.isLoggedIn()) {
      this.notifications.set([]);
      return;
    }

    if (showLoading) {
      this.loading.set(true);
    }

    this.http.get<NotificationItem[]>(this.apiUrl, { headers: this.authHeaders() }).subscribe({
      next: (items) => {
        this.notifications.set(items || []);
        if (showLoading) {
          this.loading.set(false);
        }
      },
      error: () => {
        if (showLoading) {
          this.loading.set(false);
        }
      },
    });
  }

  /**
   * Marca una notificación como leída
   */
  markAsRead(uuid: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${uuid}/read`, {}, { headers: this.authHeaders() }).pipe(
      tap(() => {
        this.notifications.update(list =>
          list.map(item => (item.uuid === uuid ? { ...item, read: true } : item))
        );
      })
    );
  }

  /**
   * Marca todas las notificaciones como leídas
   */
  markAllAsRead(): Observable<any> {
    return this.http.post(`${this.apiUrl}/read-all`, {}, { headers: this.authHeaders() }).pipe(
      tap(() => {
        this.notifications.update(list => list.map(item => ({ ...item, read: true })));
      })
    );
  }

  /**
   * Elimina una notificación específica
   */
  deleteNotification(uuid: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${uuid}`, { headers: this.authHeaders() }).pipe(
      tap(() => {
        this.notifications.update(list => list.filter(item => item.uuid !== uuid));
      })
    );
  }
}
