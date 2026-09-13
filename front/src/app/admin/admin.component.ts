import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

export type AdminTab = 'home' | 'events' | 'news' | 'polls' | 'users' | 'settings';

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

export interface UserItem {
  uuid: string;
  name: string;
  email: string;
  rol?: { name: string };
  role?: string;
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
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly formBuilder = inject(FormBuilder);
  readonly authService = inject(AuthService);

  private readonly eventsApiUrl = 'http://localhost:3000/events';
  private readonly publicationsApiUrl = 'http://localhost:3000/publications';
  private readonly usersApiUrl = 'http://localhost:3000/users';

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
    imageUrl: [''],
  });

  // Modal de Recorte de Imagen (Estilo red social / portada)
  @ViewChild('cropperCanvas') cropperCanvasRef?: ElementRef<HTMLCanvasElement>;
  loadedImage: HTMLImageElement | null = null;
  readonly cropModalOpen = signal<boolean>(false);
  readonly cropTarget = signal<'event' | 'publication'>('event');
  readonly rawImageSrc = signal<string>('');
  readonly zoom = signal<number>(1);
  readonly rotation = signal<number>(0);
  readonly selectedAspectRatio = signal<'16:9' | '4:3' | '1:1'>('16:9');
  readonly cropLoading = signal<boolean>(false);

  // Coordenadas de desplazamiento y estado de arrastre
  panX = 0;
  panY = 0;
  isDragging = false;
  dragStartX = 0;
  dragStartY = 0;
  dragStartPanX = 0;
  dragStartPanY = 0;

  // Colecciones de eventos conectados al backend
  activeEvents = signal<AdminEventItem[]>([]);
  pastEvents = signal<AdminEventItem[]>([]);
  readonly eventFilter = signal<'active' | 'past'>('active');

  // Filtros de búsqueda y fecha para eventos
  readonly eventSearchQuery = signal<string>('');
  readonly eventDateMonthFilter = signal<string>('all');

  // Listas filtradas reactivas de eventos
  readonly filteredActiveEvents = computed<AdminEventItem[]>(() => {
    return this.applyEventFilters(this.activeEvents());
  });

  readonly filteredPastEvents = computed<AdminEventItem[]>(() => {
    return this.applyEventFilters(this.pastEvents());
  });

  private applyEventFilters(events: AdminEventItem[]): AdminEventItem[] {
    const query = this.eventSearchQuery().trim().toLowerCase();
    const month = this.eventDateMonthFilter().toUpperCase();

    return events.filter((item) => {
      const matchesQuery =
        !query ||
        item.title?.toLowerCase().includes(query) ||
        item.subtitle?.toLowerCase().includes(query) ||
        item.location?.toLowerCase().includes(query) ||
        item.city?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.dateDay?.toLowerCase().includes(query) ||
        item.dateMonth?.toLowerCase().includes(query);

      const matchesMonth =
        month === 'ALL' || !item.dateMonth || item.dateMonth.toUpperCase() === month;

      return matchesQuery && matchesMonth;
    });
  }

  resetEventFilters(): void {
    this.eventSearchQuery.set('');
    this.eventDateMonthFilter.set('all');
  }

  // Publicaciones
  publications: Publication[] = [];

  // Gestión de Usuarios (RF-05 / Admin)
  users = signal<UserItem[]>([]);
  readonly userSearchTerm = signal<string>('');
  readonly userRoleFilter = signal<string>('all');

  readonly filteredUsers = computed<UserItem[]>(() => {
    const list = this.users() || [];
    const filter = (this.userRoleFilter() || 'all').toLowerCase();
    const term = (this.userSearchTerm() || '').trim().toLowerCase();

    return list.filter((u) => {
      const userRole = (u.rol?.name || u.role || 'user').toString().toLowerCase();
      const matchesRole = filter === 'all' || userRole === filter;
      const matchesSearch =
        !term ||
        (u.name && u.name.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term));

      return matchesRole && matchesSearch;
    });
  });

  resetUserFilters(): void {
    this.userSearchTerm.set('');
    this.userRoleFilter.set('all');
  }

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
    this.loadUsers();

    // Conectar cambios del formulario al signal reactivo
    this.eventForm.valueChanges.subscribe(() => {
      this.formValueSignal.set(this.eventForm.getRawValue());
    });
  }

  setTab(tab: AdminTab): void {
    this.activeTab.set(tab);
    this.clearAlerts();
    if (tab === 'users') {
      this.loadUsers();
    }
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

  loadUsers(): void {
    if (!this.authService.getToken()) return;
    this.http.get<{ data: UserItem[] }>(`${this.usersApiUrl}?limit=100`, this.options).subscribe({
      next: (res) => {
        this.users.set(res.data || []);
      },
      error: () => {
        this.error = 'No fue posible cargar el listado de usuarios.';
      },
    });
  }

  changeUserRole(uuid: string, newRole: string): void {
    this.clearAlerts();
    this.http.patch(`${this.usersApiUrl}/${uuid}/role`, { role: newRole }, this.options).subscribe({
      next: () => {
        this.message = 'Rol de usuario actualizado correctamente.';
        this.loadUsers();
        this.clearAlertsSoon();
      },
      error: (err) => {
        this.error = err?.error?.message || 'No fue posible cambiar el rol del usuario.';
      },
    });
  }

  deleteUserAccount(uuid: string, userName: string = 'este usuario'): void {
    this.clearAlerts();
    if (!confirm(`¿Estás seguro de que deseas eliminar definitivamente a ${userName}?`)) return;
    this.http.delete(`${this.usersApiUrl}/${uuid}`, this.options).subscribe({
      next: () => {
        this.message = 'Usuario eliminado del sistema correctamente.';
        this.loadUsers();
        this.clearAlertsSoon();
      },
      error: (err) => {
        this.error = err?.error?.message || 'No fue posible eliminar al usuario.';
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
    const raw = this.publicationForm.getRawValue();
    const payload: { title: string; content: string; media?: string[] } = {
      title: raw.title,
      content: raw.content,
    };
    if (raw.imageUrl && raw.imageUrl.trim()) {
      payload.media = [raw.imageUrl.trim()];
    }

    this.http.post(this.publicationsApiUrl, payload, this.options).subscribe({
      next: () => {
        this.message = '¡Publicación creada exitosamente!';
        this.publicationForm.reset();
        this.loadPublications();
        this.clearAlertsSoon();
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
        this.clearAlertsSoon();
      },
      error: () => {
        this.error = 'No tienes permiso para eliminar esta publicación.';
      },
    });
  }

  // =========================================================================
  // GESTIÓN DE SUBIDA Y RECORTE DE IMÁGENES (CANVAS INTERACTIVO WYSIWYG)
  // =========================================================================
  openFilePicker(target: 'event' | 'publication'): void {
    this.cropTarget.set(target);
    const fileInput = document.getElementById('admin-image-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
      fileInput.click();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.error = 'Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        this.rawImageSrc.set(result);
        const img = new Image();
        img.onload = () => {
          this.loadedImage = img;
          this.zoom.set(1);
          this.rotation.set(0);
          this.panX = 0;
          this.panY = 0;
          this.selectedAspectRatio.set('16:9');
          this.cropModalOpen.set(true);
          setTimeout(() => {
            this.drawCropperCanvas();
          }, 60);
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
  }

  drawCropperCanvas(): void {
    if (!this.loadedImage || !this.cropperCanvasRef) return;
    const canvas = this.cropperCanvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let targetWidth = 800;
    let ratioNum = 16 / 9;
    if (this.selectedAspectRatio() === '4:3') {
      ratioNum = 4 / 3;
      targetWidth = 800;
    } else if (this.selectedAspectRatio() === '1:1') {
      ratioNum = 1;
      targetWidth = 600;
    }
    const targetHeight = Math.round(targetWidth / ratioNum);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    ctx.clearRect(0, 0, targetWidth, targetHeight);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const rot = this.rotation();
    const isRotated90 = rot === 90 || rot === 270;
    const effImgW = isRotated90 ? this.loadedImage.naturalHeight : this.loadedImage.naturalWidth;
    const effImgH = isRotated90 ? this.loadedImage.naturalWidth : this.loadedImage.naturalHeight;

    const baseScale = Math.max(targetWidth / effImgW, targetHeight / effImgH);
    const currentScale = baseScale * this.zoom();

    const drawW = this.loadedImage.naturalWidth * currentScale;
    const drawH = this.loadedImage.naturalHeight * currentScale;

    const effDrawW = isRotated90 ? drawH : drawW;
    const effDrawH = isRotated90 ? drawW : drawH;

    const maxPanX = Math.max(0, (effDrawW - targetWidth) / 2);
    const maxPanY = Math.max(0, (effDrawH - targetHeight) / 2);

    this.panX = Math.max(-maxPanX, Math.min(maxPanX, this.panX));
    this.panY = Math.max(-maxPanY, Math.min(maxPanY, this.panY));

    ctx.save();
    ctx.translate(targetWidth / 2 + this.panX, targetHeight / 2 + this.panY);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.drawImage(this.loadedImage, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }

  onMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragStartPanX = this.panX;
    this.dragStartPanY = this.panY;
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging || !this.cropperCanvasRef) return;
    const canvas = this.cropperCanvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const scaleRatio = canvas.width / rect.width;

    const deltaX = (event.clientX - this.dragStartX) * scaleRatio;
    const deltaY = (event.clientY - this.dragStartY) * scaleRatio;

    this.panX = this.dragStartPanX + deltaX;
    this.panY = this.dragStartPanY + deltaY;
    this.drawCropperCanvas();
  }

  onMouseUp(): void {
    this.isDragging = false;
  }

  onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.isDragging = true;
      this.dragStartX = event.touches[0].clientX;
      this.dragStartY = event.touches[0].clientY;
      this.dragStartPanX = this.panX;
      this.dragStartPanY = this.panY;
    }
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging || event.touches.length !== 1 || !this.cropperCanvasRef) return;
    const canvas = this.cropperCanvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const scaleRatio = canvas.width / rect.width;

    const deltaX = (event.touches[0].clientX - this.dragStartX) * scaleRatio;
    const deltaY = (event.touches[0].clientY - this.dragStartY) * scaleRatio;

    this.panX = this.dragStartPanX + deltaX;
    this.panY = this.dragStartPanY + deltaY;
    this.drawCropperCanvas();
  }

  onTouchEnd(): void {
    this.isDragging = false;
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const zoomDelta = event.deltaY < 0 ? 0.08 : -0.08;
    const newZoom = Math.min(3.5, Math.max(1, +(this.zoom() + zoomDelta).toFixed(2)));
    this.zoom.set(newZoom);
    this.drawCropperCanvas();
  }

  setZoom(value: string | number): void {
    const val = typeof value === 'string' ? parseFloat(value) : value;
    this.zoom.set(Math.min(3.5, Math.max(1, +(val).toFixed(2))));
    this.drawCropperCanvas();
  }

  adjustZoom(delta: number): void {
    const newZoom = Math.min(3.5, Math.max(1, +(this.zoom() + delta).toFixed(2)));
    this.zoom.set(newZoom);
    this.drawCropperCanvas();
  }

  rotate90(): void {
    this.rotation.update((r) => (r + 90) % 360);
    this.panX = 0;
    this.panY = 0;
    this.drawCropperCanvas();
  }

  resetPanAndZoom(): void {
    this.zoom.set(1);
    this.panX = 0;
    this.panY = 0;
    this.rotation.set(0);
    this.drawCropperCanvas();
  }

  setAspectRatio(ratio: '16:9' | '4:3' | '1:1'): void {
    this.selectedAspectRatio.set(ratio);
    this.panX = 0;
    this.panY = 0;
    this.drawCropperCanvas();
  }

  applyCrop(): void {
    if (!this.cropperCanvasRef) return;
    const canvas = this.cropperCanvasRef.nativeElement;

    // Redibujar para asegurar sincronía exacta
    this.drawCropperCanvas();

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

    if (this.cropTarget() === 'event') {
      this.eventForm.controls.imageUrl.setValue(croppedDataUrl);
      this.formValueSignal.set(this.eventForm.getRawValue());
      this.message = '¡Foto recortada y aplicada a la portada del evento!';
    } else {
      this.publicationForm.patchValue({ imageUrl: croppedDataUrl });
      this.message = '¡Foto recortada y aplicada a la publicación!';
    }

    this.clearAlertsSoon();
    this.cropModalOpen.set(false);
  }

  cancelCrop(): void {
    this.cropModalOpen.set(false);
    this.rawImageSrc.set('');
    this.loadedImage = null;
  }

  private clearAlertsSoon(): void {
    setTimeout(() => {
      if (this.message) this.message = '';
    }, 4500);
  }
}

