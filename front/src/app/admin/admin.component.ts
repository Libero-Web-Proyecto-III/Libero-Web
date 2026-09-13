import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

export type AdminTab = 'home' | 'events' | 'news' | 'users' | 'settings';

export interface AdminEventItem {
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
  status: 'active' | 'past';
  isSubscribed?: boolean;
  createdAt?: string;
}

interface Publication {
  uuid: string;
  title: string;
  content?: string;
  author?: { name: string; rol?: { name: string } };
  createdAt?: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly formBuilder = inject(FormBuilder);
  readonly authService = inject(AuthService);

  private readonly eventsApiUrl = 'http://localhost:3000/events';
  private readonly publicationsApiUrl = 'http://localhost:3000/publications';

  // Pestaña activa
  readonly activeTab = signal<AdminTab>('events');

  // Modal para ver tarjeta abierta completa
  readonly selectedEventDetail = signal<AdminEventItem | null>(null);

  // Formulario de eventos con los campos exactos del catálogo y valores de ejemplo listos
  readonly eventForm = this.formBuilder.nonNullable.group({
    title: ['SINFONÍA NOCTURNA: GALA Y MÚSICA EN VIVO', [Validators.required, Validators.minLength(3)]],
    subtitle: ['Una velada inmersiva con la Orquesta Filarmónica Contemporánea', [Validators.required]],
    dateDay: ['28', [Validators.required, Validators.maxLength(2)]],
    dateMonth: ['OCT', [Validators.required]],
    time: ['20:00 - 23:00 HRS', [Validators.required]],
    location: ['Gran Teatro Metropolitano', [Validators.required]],
    city: ['Sala Principal', [Validators.required]],
    description: ['Disfruta de una experiencia única. Un encuentro exclusivo donde la música, el arte y la cultura se fusionan en un espacio diseñado para inspirar...', [Validators.required, Validators.minLength(10)]],
    imageUrl: ['https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1400&q=80', [Validators.required]],
  });

  // Signal para rastrear cambios en tiempo real del formulario para las vistas previas
  readonly formValueSignal = signal(this.eventForm.getRawValue());

  // Formulario de Noticias / Publicaciones
  readonly publicationForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    content: ['', Validators.required],
  });

  // Colecciones de eventos conectados al backend
  activeEvents = signal<AdminEventItem[]>([]);
  pastEvents = signal<AdminEventItem[]>([]);
  readonly eventFilter = signal<'active' | 'past'>('active');

  // Publicaciones
  publications: Publication[] = [];

  // Mensajes de estado
  message = '';
  error = '';
  isLoading = false;

  isFieldInvalid(name: 'title' | 'subtitle' | 'dateDay' | 'dateMonth' | 'time' | 'location' | 'city' | 'description' | 'imageUrl'): boolean {
    const control = this.eventForm.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  // Vista Previa reactiva que se actualiza al escribir en el formulario
  readonly livePreview = computed<AdminEventItem>(() => {
    const val = this.formValueSignal();
    return {
      uuid: 'preview-uuid-temp',
      title: val.title?.trim() || 'TÍTULO DEL EVENTO EN VIVO',
      subtitle: val.subtitle?.trim() || 'Subtítulo descriptivo o temática del evento para la comunidad',
      dateDay: val.dateDay?.trim() || '28',
      dateMonth: val.dateMonth?.trim() || 'OCT',
      time: val.time?.trim() || '20:00 - 23:00 HRS',
      location: val.location?.trim() || 'Gran Teatro Metropolitano',
      city: val.city?.trim() || 'Sala Principal',
      description: val.description?.trim() || 'Disfruta de una experiencia única. Un encuentro exclusivo donde la música, el arte y la cultura se fusionan en un espacio diseñado para inspirar...',
      imageUrl: val.imageUrl?.trim() || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1400&q=80',
      status: 'active',
      isSubscribed: false,
    };
  });

  readonly userInitials = computed(() => {
    const user = this.authService.getUser();
    if (!user || !user.username) return 'A';
    return user.username.charAt(0).toUpperCase();
  });

  ngOnInit(): void {
    this.loadEvents();
    this.loadPublications();

    // Conectar cambios del formulario al signal reactivo
    this.eventForm.valueChanges.subscribe(() => {
      this.formValueSignal.set(this.eventForm.getRawValue());
    });
  }

  setTab(tab: AdminTab): void {
    this.activeTab.set(tab);
    this.clearAlerts();
  }

  clearAlerts(): void {
    this.message = '';
    this.error = '';
  }

  private get options() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }),
    };
  }

  loadEvents(): void {
    this.http.get<AdminEventItem[]>(this.eventsApiUrl).subscribe({
      next: (data) => {
        if (data && Array.isArray(data)) {
          this.activeEvents.set(data.filter(e => e.status !== 'past'));
          this.pastEvents.set(data.filter(e => e.status === 'past'));
        }
      },
      error: () => {
        this.error = 'No fue posible cargar los eventos desde el servidor.';
      },
    });
  }

  loadPublications(): void {
    this.isLoading = true;
    this.http.get<{ data: Publication[] }>(this.publicationsApiUrl, this.options).subscribe({
      next: response => {
        this.publications = response.data || [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  createEvent(): void {
    this.clearAlerts();

    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      const missing: string[] = [];
      if (this.eventForm.controls.title.invalid) missing.push('Título (mínimo 3 letras)');
      if (this.eventForm.controls.subtitle.invalid) missing.push('Subtítulo');
      if (this.eventForm.controls.dateDay.invalid) missing.push('Día (ej. 28)');
      if (this.eventForm.controls.location.invalid) missing.push('Lugar / Recinto');
      if (this.eventForm.controls.description.invalid) missing.push('Descripción (mínimo 10 letras)');

      this.error = `Por favor completa los campos requeridos: ${missing.join(', ')}.`;
      return;
    }

    this.isLoading = true;
    const formVal = this.eventForm.getRawValue();
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 3600 * 1000);

    const payload = {
      title: formVal.title.trim().toUpperCase(),
      subtitle: formVal.subtitle.trim(),
      dateDay: formVal.dateDay.trim().padStart(2, '0'),
      dateMonth: formVal.dateMonth.trim().toUpperCase(),
      time: formVal.time.trim(),
      location: formVal.location.trim(),
      city: formVal.city.trim(),
      description: formVal.description.trim(),
      imageUrl: formVal.imageUrl.trim() || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1400&q=80',
      status: 'active',
      startDate: now.toISOString(),
      endDate: nextWeek.toISOString(),
    };

    this.http.post<AdminEventItem>(this.eventsApiUrl, payload, this.options).subscribe({
      next: (created) => {
        this.isLoading = false;
        this.message = `¡Evento "${created.title || payload.title}" publicado con éxito! Guardado en la base de datos.`;
        this.error = '';

        // Sugerir nueva plantilla de datos para seguir creando
        this.eventForm.reset({
          title: 'NOCHE DE GALA & ARTE VISUAL',
          subtitle: 'Encuentro cultural y performance interactivo',
          dateDay: '15',
          dateMonth: 'NOV',
          time: '20:00 - 23:00 HRS',
          location: 'Centro de Bellas Artes',
          city: 'Salón de Actos',
          description: 'Una noche para celebrar el talento contemporáneo con proyecciones audiovisuales y música instrumental en directo.',
          imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1400&q=80',
        });
        this.formValueSignal.set(this.eventForm.getRawValue());
        this.loadEvents();
      },
      error: (err) => {
        this.isLoading = false;
        const serverMsg = err?.error?.message;
        if (Array.isArray(serverMsg)) {
          this.error = `Validación del servidor: ${serverMsg.join(', ')}`;
        } else if (typeof serverMsg === 'string') {
          this.error = `Error al guardar: ${serverMsg}`;
        } else if (err?.status === 401) {
          this.error = 'Sesión expirada o no autenticada. Por favor vuelve a iniciar sesión.';
        } else if (err?.status === 403) {
          this.error = 'No tienes permiso de administrador para publicar este evento.';
        } else {
          this.error = 'No fue posible guardar el evento en el servidor (http://localhost:3000/events).';
        }
      },
    });
  }

  moveToPast(event: AdminEventItem): void {
    this.clearAlerts();
    if (!event.uuid) return;

    this.http.patch(`${this.eventsApiUrl}/${event.uuid}`, { status: 'past' }, this.options).subscribe({
      next: () => {
        this.message = `El evento "${event.title}" se movió a eventos vencidos.`;
        this.error = '';
        this.loadEvents();
      },
      error: (err) => {
        this.error = err?.error?.message || 'No fue posible actualizar el estado del evento.';
      },
    });
  }

  restoreToActive(event: AdminEventItem): void {
    this.clearAlerts();
    if (!event.uuid) return;

    this.http.patch(`${this.eventsApiUrl}/${event.uuid}`, { status: 'active' }, this.options).subscribe({
      next: () => {
        this.message = `El evento "${event.title}" fue reactivado en los eventos activos.`;
        this.error = '';
        this.loadEvents();
      },
      error: (err) => {
        this.error = err?.error?.message || 'No fue posible reactivar el evento.';
      },
    });
  }

  deleteEvent(event: AdminEventItem): void {
    this.clearAlerts();
    if (!event?.uuid) {
      this.error = 'No se pudo identificar el UUID del evento a eliminar.';
      return;
    }

    if (!confirm(`¿Estás seguro de que deseas eliminar definitivamente "${event.title}"?`)) return;

    this.http.delete(`${this.eventsApiUrl}/${event.uuid}`, this.options).subscribe({
      next: () => {
        this.message = 'Evento eliminado correctamente de la base de datos.';
        this.error = '';
        this.loadEvents();
      },
      error: (err) => {
        this.error = err?.error?.message || 'No tienes permiso o no fue posible eliminar este evento.';
      },
    });
  }

  openEventModal(event: AdminEventItem): void {
    this.selectedEventDetail.set(event);
  }

  closeEventModal(): void {
    this.selectedEventDetail.set(null);
  }

  // Creador de Publicaciones
  createPublication(): void {
    if (!this.authService.isAdmin() || this.publicationForm.invalid) return;
    this.http.post(this.publicationsApiUrl, this.publicationForm.getRawValue(), this.options).subscribe({
      next: () => {
        this.message = '¡Publicación creada exitosamente!';
        this.publicationForm.reset();
        this.loadPublications();
      },
      error: () => {
        this.error = 'No fue posible crear la publicación.';
      },
    });
  }

  deletePublication(uuid: string): void {
    if (!confirm('¿Estás seguro de que deseas eliminar esta publicación?')) return;
    this.http.delete(`${this.publicationsApiUrl}/${uuid}`, this.options).subscribe({
      next: () => {
        this.message = 'Publicación eliminada correctamente.';
        this.loadPublications();
      },
      error: () => {
        this.error = 'No tienes permiso para eliminar esta publicación.';
      },
    });
  }
}
