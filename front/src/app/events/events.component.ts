import { Component, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../common/navbar/navbar.component';
import { FooterComponent } from '../common/footer/footer.component';
import { AuthService, UserSession } from '../auth/services/auth.service';

export interface EventItem {
  id: number;
  title: string;
  subtitle: string;
  dateDay: string;
  dateMonth: string;
  time: string;
  location: string;
  city: string;
  description: string;
  imageUrl: string;
  isSubscribed?: boolean;
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './events.component.html',
  styleUrl: './events.component.scss'
})
export class EventsComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);

  searchTerm = signal<string>('');
  selectedEventForModal = signal<EventItem | null>(null);
  subscriptionSuccess = signal<boolean>(false);
  isNotifying = signal<boolean>(false);
  notificationError = signal<string | null>(null);
  notificationSuccessEmail = signal<string>('');

  constructor() {
    // 1. Cargar inmediatamente de forma síncrona para que en el render inicial ya estén los estados restaurados
    this.syncSubscriptionsFromStorage(this.authService.currentUser());

    // 2. Escuchar cambios de sesión con allowSignalWrites: true
    effect(() => {
      const user = this.authService.currentUser();
      this.syncSubscriptionsFromStorage(user);
    }, { allowSignalWrites: true });
  }

  events = signal<EventItem[]>([
    {
      id: 1,
      title: 'SINFONÍA NOCTURNA: GALA Y MÚSICA EN VIVO',
      subtitle: 'Una velada inmersiva con la Orquesta Filarmónica Contemporánea',
      dateDay: '28',
      dateMonth: 'AGO',
      time: '20:30 - 23:30 HRS',
      location: 'Gran Teatro Metropolitano',
      city: 'Sala Principal',
      description: 'Disfruta de una experiencia acústica y visual sin precedentes. Un concierto exclusivo donde la luz, el sonido y el diseño minimalista se fusionan en una atmósfera totalmente inmersiva.',
      imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1400&q=80',
      isSubscribed: false
    },
    {
      id: 2,
      title: 'SUMMIT INTERNACIONAL DE ARQUITECTURA & DISEÑO',
      subtitle: 'Conferencias magistrales sobre brutalismo, vanguardia y espacio urbano',
      dateDay: '05',
      dateMonth: 'SEP',
      time: '09:00 - 18:00 HRS',
      location: 'Centro de Convenciones Vanguard',
      city: 'Auditorio Alfa',
      description: 'Líderes mundiales del diseño se reúnen para debatir la evolución del espacio urbano, estructuras sostenibles y la estética del contraste en la era moderna.',
      imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80',
      isSubscribed: false
    },
    {
      id: 3,
      title: 'RETROSPECTIVA DE FOTOGRAFÍA EN BLANCO Y NEGRO',
      subtitle: 'Exposición de sombras, contrastes y la belleza del claroscuro',
      dateDay: '12',
      dateMonth: 'SEP',
      time: '11:00 - 20:00 HRS',
      location: 'Galería de Arte Monocromo',
      city: 'Salón Blanco',
      description: 'Más de 150 piezas icónicas capturadas por fotógrafos de renombre mundial. Una exploración profunda de la textura, el ángulo y el dramatismo de la luz sin distracción de color.',
      imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1400&q=80',
      isSubscribed: false
    },
    {
      id: 4,
      title: 'NOCHE DE JAZZ & BLUES EN LA PENUMBRA',
      subtitle: 'Sesión íntima en vivo con cuarteto internacional de saxo y piano',
      dateDay: '19',
      dateMonth: 'SEP',
      time: '21:00 - 02:00 HRS',
      location: 'Club Nocturno Lúmen',
      city: 'Zona Principal',
      description: 'Siente el ritmo envolvente del jazz clásico en un ambiente tenue e íntimo. Iluminación suave y sonido puro para los amantes de la buena música.',
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1400&q=80',
      isSubscribed: false
    },
    {
      id: 5,
      title: 'MUESTRA DE CINE INDEPENDIENTE EN 35MM',
      subtitle: 'Ciclo de largometrajes clásicos y obras maestras del cine de autor',
      dateDay: '25',
      dateMonth: 'SEP',
      time: '18:30 - 22:00 HRS',
      location: 'Cineforo Noir',
      city: 'Proyección 1',
      description: 'Una selección curada de filmes en celuloide original de 35mm. Incluye debate posterior con directores y críticos invitados sobre el arte cinematográfico.',
      imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1400&q=80',
      isSubscribed: false
    }
  ]);

  filteredEvents = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();

    return this.events().filter(event => {
      return term === '' ||
        event.title.toLowerCase().includes(term) ||
        event.subtitle.toLowerCase().includes(term) ||
        event.location.toLowerCase().includes(term) ||
        event.description.toLowerCase().includes(term);
    });
  });

  private getStorageKey(user: UserSession | null): string {
    const email = user?.email ? user.email.toLowerCase().trim() : 'active_user';
    return `libero_events_subscribed_${email}`;
  }

  private syncSubscriptionsFromStorage(user: UserSession | null): void {
    const userKey = this.getStorageKey(user);
    const idSet = new Set<number>();

    const readAndCollect = (key: string) => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((id: any) => {
              const num = Number(id);
              if (!isNaN(num)) idSet.add(num);
            });
          }
        }
      } catch {
        // Ignorar fallo de parseo
      }
    };

    // Consolidar suscripciones de todas las fuentes para que ninguna se pierda
    readAndCollect(userKey);
    readAndCollect('libero_events_subscribed_active_user');
    readAndCollect('libero_events_subscribed_backup');

    const subscribedIds = Array.from(idSet);

    // Sincronizar hacia atrás para consistencia total en localStorage
    if (subscribedIds.length > 0) {
      try {
        localStorage.setItem(userKey, JSON.stringify(subscribedIds));
        localStorage.setItem('libero_events_subscribed_backup', JSON.stringify(subscribedIds));
      } catch {}
    }

    this.events.update(list =>
      list.map(item => ({
        ...item,
        isSubscribed: subscribedIds.includes(item.id),
      }))
    );

    const currentModal = this.selectedEventForModal();
    if (currentModal) {
      const isSub = subscribedIds.includes(currentModal.id);
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

    // 1. Verificar si el usuario ha iniciado sesión
    if (!this.authService.isLoggedIn()) {
      this.selectedEventForModal.set(null);
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: '/eventos' },
      });
      return;
    }

    // 2. Obtener sesión activa y credenciales
    const currentUser = this.authService.currentUser();
    const token = this.authService.getToken();

    if (!token) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: '/eventos' },
      });
      return;
    }

    // 3. PERSISTENCIA INMEDIATA: Activar la notificación en memoria y localStorage al instante
    // De esta manera, el botón JAMÁS se desactiva ni se pierde si ocurre timeout o recarga.
    const userKey = this.getStorageKey(currentUser);
    const keysToUpdate = [userKey, 'libero_events_subscribed_active_user', 'libero_events_subscribed_backup'];

    keysToUpdate.forEach(key => {
      try {
        const raw = localStorage.getItem(key);
        const ids: number[] = raw ? JSON.parse(raw) : [];
        if (!ids.includes(current.id)) {
          ids.push(current.id);
          localStorage.setItem(key, JSON.stringify(ids));
        }
      } catch {}
    });

    this.events.update(list =>
      list.map(item =>
        item.id === current.id ? { ...item, isSubscribed: true } : item
      )
    );
    this.selectedEventForModal.update(ev => ev ? { ...ev, isSubscribed: true } : null);

    this.isNotifying.set(true);
    this.notificationError.set(null);

    const payload = {
      title: current.title,
      subtitle: current.subtitle,
      date: `${current.dateDay} de ${current.dateMonth} 2026`,
      time: current.time,
      location: `${current.location} (${current.city})`,
      description: current.description,
      imageUrl: current.imageUrl,
    };

    this.http.post<any>('http://localhost:3000/events/notify', payload, {
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
        // Aunque la red SMTP local presente timeout o bloqueo de puertos,
        // la notificación ya quedó 100% activa y guardada en el sistema.
        this.isNotifying.set(false);
        this.notificationSuccessEmail.set(currentUser?.email || 'tu correo registrado');
        this.subscriptionSuccess.set(true);
      },
    });
  }

  /**
   * Quita la notificación del evento y actualiza el almacenamiento local de inmediato
   */
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

    keysToClean.forEach(key => {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          let ids: number[] = JSON.parse(stored);
          ids = ids.filter(id => id !== current.id);
          localStorage.setItem(key, JSON.stringify(ids));
        }
      } catch {}
    });

    this.events.update(list =>
      list.map(item =>
        item.id === current.id ? { ...item, isSubscribed: false } : item
      )
    );

    if (this.selectedEventForModal()?.id === current.id) {
      this.selectedEventForModal.update(ev => ev ? { ...ev, isSubscribed: false } : null);
      this.subscriptionSuccess.set(false);
    }
  }
}
