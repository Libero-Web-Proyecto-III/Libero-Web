import { Component, signal, computed, inject, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../common/navbar/navbar.component';
import { FooterComponent } from '../common/footer/footer.component';
import { AuthService, UserSession } from '../auth/services/auth.service';

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

  private readonly apiUrl = 'http://localhost:3000/events';

  searchTerm = signal<string>('');
  selectedEventForModal = signal<EventItem | null>(null);
  subscriptionSuccess = signal<boolean>(false);
  isNotifying = signal<boolean>(false);
  notificationError = signal<string | null>(null);
  notificationSuccessEmail = signal<string>('');

  events = signal<EventItem[]>([]);
  isLoading = signal<boolean>(false);

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      this.syncSubscriptionsFromStorage(user);
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
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
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
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

  private getStorageKey(user: UserSession | null): string {
    const email = user?.email ? user.email.toLowerCase().trim() : 'active_user';
    return `libero_events_subscribed_${email}`;
  }

  private syncSubscriptionsFromStorage(user: UserSession | null): void {
    const userKey = this.getStorageKey(user);
    const idSet = new Set<string>();

    const readAndCollect = (key: string) => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((id: any) => {
              if (id !== undefined && id !== null) idSet.add(String(id));
            });
          }
        }
      } catch {}
    };

    readAndCollect(userKey);
    readAndCollect('libero_events_subscribed_active_user');
    readAndCollect('libero_events_subscribed_backup');

    const subscribedIds = Array.from(idSet);

    if (subscribedIds.length > 0) {
      try {
        localStorage.setItem(userKey, JSON.stringify(subscribedIds));
        localStorage.setItem('libero_events_subscribed_backup', JSON.stringify(subscribedIds));
      } catch {}
    }

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
    const keysToUpdate = [userKey, 'libero_events_subscribed_active_user', 'libero_events_subscribed_backup'];
    const currentIdentifier = String(current.uuid);

    keysToUpdate.forEach(key => {
      try {
        const raw = localStorage.getItem(key);
        const ids: string[] = raw ? JSON.parse(raw).map((i: any) => String(i)) : [];
        if (!ids.includes(currentIdentifier)) {
          ids.push(currentIdentifier);
          localStorage.setItem(key, JSON.stringify(ids));
        }
      } catch {}
    });

    this.events.update(list =>
      list.map(item => {
        const itemId = String(item.uuid);
        return itemId === currentIdentifier ? { ...item, isSubscribed: true } : item;
      })
    );
    this.selectedEventForModal.update(ev => ev ? { ...ev, isSubscribed: true } : null);

    this.isNotifying.set(true);
    this.notificationError.set(null);

    const payload = {
      title: current.title,
      subtitle: current.subtitle,
      date: `${current.dateDay || ''} de ${current.dateMonth || ''} 2026`,
      time: current.time,
      location: `${current.location} (${current.city})`,
      description: current.description,
      imageUrl: current.imageUrl,
    };

    this.http.post<any>(`${this.apiUrl}/notify`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).subscribe({
      next: () => {
        this.isNotifying.set(false);
        this.notificationSuccessEmail.set(currentUser?.email || 'tu correo registrado');
        this.subscriptionSuccess.set(true);
      },
      error: () => {
        this.isNotifying.set(false);
        this.notificationSuccessEmail.set(currentUser?.email || 'tu correo registrado');
        this.subscriptionSuccess.set(true);
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
    const userKey = this.getStorageKey(currentUser);
    const keysToClean = [userKey, 'libero_events_subscribed_active_user', 'libero_events_subscribed_backup'];
    const currentIdentifier = String(current.uuid);

    keysToClean.forEach(key => {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          let ids: string[] = JSON.parse(stored).map((i: any) => String(i));
          ids = ids.filter(id => id !== currentIdentifier);
          localStorage.setItem(key, JSON.stringify(ids));
        }
      } catch {}
    });

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
  }
}
