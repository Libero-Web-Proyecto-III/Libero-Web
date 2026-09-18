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
      this.syncSubscriptionsFromStorage(user);
      if (user) {
        this.loadUserSubscriptions();
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    try {
      localStorage.removeItem('libero_events_subscribed_active_user');
      localStorage.removeItem('libero_events_subscribed_backup');
    } catch {}
    this.loadEvents();
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
          this.syncSubscriptionsFromStorage(this.authService.currentUser());
          this.loadUserSubscriptions();
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
    const user = this.authService.currentUser();
    if (!token || !user) return;

    const userKey = this.getStorageKey(user);
    if (!userKey) return;

    this.http.get<string[]>(`${this.apiUrl}/user/subscriptions`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (uuids) => {
        if (Array.isArray(uuids)) {
          try {
            localStorage.setItem(userKey, JSON.stringify(uuids));
          } catch {}

          this.events.update(list =>
            list.map(item => ({
              ...item,
              isSubscribed: uuids.includes(String(item.uuid)),
            }))
          );

          const curModal = this.selectedEventForModal();
          if (curModal) {
            this.selectedEventForModal.update(ev =>
              ev ? { ...ev, isSubscribed: uuids.includes(String(ev.uuid)) } : null
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

  private getStorageKey(user: UserSession | null): string | null {
    if (!user || !user.email) return null;
    return `libero_events_subscribed_${user.email.toLowerCase().trim()}`;
  }

  private syncSubscriptionsFromStorage(user: UserSession | null): void {
    const userKey = this.getStorageKey(user);
    if (!userKey) {
      // Si el usuario no ha iniciado sesión o no tiene email, ningún evento debe figurar suscrito
      this.events.update(list =>
        list.map(item => ({ ...item, isSubscribed: false }))
      );
      const currentModal = this.selectedEventForModal();
      if (currentModal && currentModal.isSubscribed) {
        this.selectedEventForModal.update(ev => ev ? { ...ev, isSubscribed: false } : null);
      }
      return;
    }

    const idSet = new Set<string>();
    try {
      const raw = localStorage.getItem(userKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((id: any) => {
            if (id !== undefined && id !== null) idSet.add(String(id));
          });
        }
      }
    } catch {}

    const subscribedIds = Array.from(idSet);

    this.events.update(list =>
      list.map(item => {
        const identifier = String(item.uuid);
        return {
          ...item,
          isSubscribed: subscribedIds.includes(identifier),
        };
      })
    );

    const currentModal = this.selectedEventForModal();
    if (currentModal) {
      const modalId = String(currentModal.uuid);
      const isSub = subscribedIds.includes(modalId);
      if (currentModal.isSubscribed !== isSub) {
        this.selectedEventForModal.update(ev => ev ? { ...ev, isSubscribed: isSub } : null);
      }
    }
  }

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

    const userKey = this.getStorageKey(currentUser);
    const currentIdentifier = String(current.uuid);

    if (userKey) {
      try {
        const raw = localStorage.getItem(userKey);
        const ids: string[] = raw ? JSON.parse(raw).map((i: any) => String(i)) : [];
        if (!ids.includes(currentIdentifier)) {
          ids.push(currentIdentifier);
          localStorage.setItem(userKey, JSON.stringify(ids));
        }
      } catch {}
    }

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

        // Revertir en caso de fallo
        if (userKey) {
          try {
            const raw = localStorage.getItem(userKey);
            let ids: string[] = raw ? JSON.parse(raw).map((i: any) => String(i)) : [];
            ids = ids.filter(id => id !== currentIdentifier);
            localStorage.setItem(userKey, JSON.stringify(ids));
          } catch {}
        }
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

    const currentUser = this.authService.currentUser();
    const token = this.authService.getToken();
    const userKey = this.getStorageKey(currentUser);
    const currentIdentifier = String(current.uuid);

    if (userKey) {
      try {
        const stored = localStorage.getItem(userKey);
        if (stored) {
          let ids: string[] = JSON.parse(stored).map((i: any) => String(i));
          ids = ids.filter(id => id !== currentIdentifier);
          localStorage.setItem(userKey, JSON.stringify(ids));
        }
      } catch {}
    }

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
        error: () => {},
      });
    }
  }
}
