import { Component, signal, computed, inject, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../common/navbar/navbar.component';
import { FooterComponent } from '../common/footer/footer.component';
import { AuthService, UserSession } from '../auth/services/auth.service';
import { environment } from '../../environments/environment';

export interface EventItem {
  uuid: string;
  title: string;
  subtitle: string;
  dateDay: string;
  dateMonth: string;
  time: string;
  location: string;
  city: string;
  description: string;
  imageUrl: string;
  status?: string;
  isSubscribed?: boolean;
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './events.component.html',
  styleUrl: './events.component.scss'
})
export class EventsComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/events`;

  searchTerm = signal<string>('');
  selectedEventForModal = signal<EventItem | null>(null);
  subscriptionSuccess = signal<boolean>(false);
  isNotifying = signal<boolean>(false);
  notificationError = signal<string | null>(null);
  notificationSuccessEmail = signal<string>('');
  notificationMessage = signal<string>('');
  notifiedImmediately = signal<boolean>(false);

  events = signal<EventItem[]>([]);
  isLoading = signal<boolean>(false);

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.loadUserSubscriptions();
      } else {
        // Si no hay usuario autenticado, ningún evento debe figurar suscrito
        this.events.update(list =>
          list.map(item => ({ ...item, isSubscribed: false }))
        );
        const curModal = this.selectedEventForModal();
        if (curModal && curModal.isSubscribed) {
          this.selectedEventForModal.update(ev => ev ? { ...ev, isSubscribed: false } : null);
        }
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    // Limpiar cualquier residuo previo de suscripciones en localStorage
    this.cleanLegacyLocalStorage();
    this.loadEvents();
  }

  private cleanLegacyLocalStorage(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('libero_events_subscribed')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch {}
  }

  loadEvents(): void {
    this.isLoading.set(true);
    this.http.get<EventItem[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.isLoading.set(false);
        if (data && Array.isArray(data)) {
          // Filtrar los que están activos en la cartelera
          const activeList = data.filter(e => e.status !== 'past');
          this.events.set(activeList);
          if (this.authService.isLoggedIn()) {
            this.loadUserSubscriptions();
          }
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  loadUserSubscriptions(): void {
    if (!this.authService.isLoggedIn()) return;
    const token = this.authService.getToken();
    if (!token) return;

    this.http.get<string[]>(`${this.apiUrl}/user/subscriptions`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (uuids) => {
        if (Array.isArray(uuids)) {
          const subSet = new Set(uuids.map(u => String(u)));

          this.events.update(list =>
            list.map(item => ({
              ...item,
              isSubscribed: subSet.has(String(item.uuid)),
            }))
          );

          const curModal = this.selectedEventForModal();
          if (curModal) {
            this.selectedEventForModal.update(ev =>
              ev ? { ...ev, isSubscribed: subSet.has(String(ev.uuid)) } : null
            );
          }
        }
      },
      error: () => {}
    });
  }

  filteredEvents = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();

    return this.events().filter(event => {
      return term === '' ||
        event.title.toLowerCase().includes(term) ||
        (event.subtitle && event.subtitle.toLowerCase().includes(term)) ||
        (event.location && event.location.toLowerCase().includes(term)) ||
        (event.description && event.description.toLowerCase().includes(term));
    });
  });

  openModal(event: EventItem) {
    this.selectedEventForModal.set(event);
    this.subscriptionSuccess.set(false);
    this.notificationError.set(null);
  }

  closeModal() {
    this.selectedEventForModal.set(null);
    this.isNotifying.set(false);
    this.notificationError.set(null);
  }

  confirmSubscription() {
    const current = this.selectedEventForModal();
    if (!current) return;

    if (!this.authService.isLoggedIn()) {
      this.selectedEventForModal.set(null);
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: '/eventos' },
      });
      return;
    }

    const currentUser = this.authService.currentUser();
    const token = this.authService.getToken();

    if (!token) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: '/eventos' },
      });
      return;
    }

    const currentIdentifier = String(current.uuid);

    // Actualización optimista en memoria
    this.events.update(list =>
      list.map(item => {
        const itemId = String(item.uuid);
        return itemId === currentIdentifier ? { ...item, isSubscribed: true } : item;
      })
    );
    this.selectedEventForModal.update(ev => ev ? { ...ev, isSubscribed: true } : null);

    this.isNotifying.set(true);
    this.notificationError.set(null);

    this.http.post<any>(`${this.apiUrl}/${current.uuid}/subscribe`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).subscribe({
      next: (res) => {
        this.isNotifying.set(false);
        this.notificationSuccessEmail.set(currentUser?.email || 'tu correo registrado');
        this.notifiedImmediately.set(!!res?.notifiedImmediately);
        this.notificationMessage.set(res?.message || '');
        this.subscriptionSuccess.set(true);
      },
      error: (err) => {
        this.isNotifying.set(false);
        const msg = err?.error?.message;
        const errorText = Array.isArray(msg) ? msg.join(', ') : (msg || 'Error al registrar el recordatorio.');
        this.notificationError.set(errorText);

        // Revertir estado optimista en memoria en caso de error
        this.events.update(list =>
          list.map(item => String(item.uuid) === currentIdentifier ? { ...item, isSubscribed: false } : item)
        );
        this.selectedEventForModal.update(ev => ev ? { ...ev, isSubscribed: false } : null);
      },
    });
  }

  removeSubscription(eventParam?: EventItem): void {
    const current = eventParam || this.selectedEventForModal();
    if (!current) return;

    if (!this.authService.isLoggedIn()) {
      this.selectedEventForModal.set(null);
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: '/eventos' },
      });
      return;
    }

    const token = this.authService.getToken();
    const currentIdentifier = String(current.uuid);

    // Actualización en memoria
    this.events.update(list =>
      list.map(item => {
        const itemId = String(item.uuid);
        return itemId === currentIdentifier ? { ...item, isSubscribed: false } : item;
      })
    );

    const curModal = this.selectedEventForModal();
    if (curModal && String(curModal.uuid) === currentIdentifier) {
      this.selectedEventForModal.update(ev => ev ? { ...ev, isSubscribed: false } : null);
      this.subscriptionSuccess.set(false);
    }

    if (token) {
      this.http.delete<any>(`${this.apiUrl}/${current.uuid}/subscribe`, {
        headers: { Authorization: `Bearer ${token}` },
      }).subscribe({
        next: () => {},
        error: () => {
          // Re-sincronizar con el backend si hubo algún fallo
          this.loadUserSubscriptions();
        },
      });
    }
  }

  isFallbackLogo(url: string | null | undefined): boolean {
    if (!url) return true;
    const trimmed = url.trim();
    return trimmed === '' || trimmed === '/logo.png' || trimmed === 'logo.png';
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target && !target.src.endsWith('/logo.png')) {
      target.src = '/logo.png';
      target.classList.add('fallback-logo');
      const parent =
        target.closest<HTMLElement>('.card-image-wrapper, .modal-image-box') ||
        target.parentElement;
      if (parent) {
        parent.classList.add('is-fallback-logo');
        parent.classList.add('white-bg');
      }
    }
  }

  onImageLoad(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target && !target.src.endsWith('/logo.png')) {
      target.classList.remove('fallback-logo');
      const parent =
        target.closest<HTMLElement>('.card-image-wrapper, .modal-image-box') ||
        target.parentElement;
      if (parent) {
        parent.classList.remove('is-fallback-logo');
        parent.classList.remove('white-bg');
      }
    }
  }
}
