import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { SurveyBuilderComponent } from '../survey/components/survey-builder/survey-builder.component';
import { SurveyResultsComponent } from '../survey/components/survey-results/survey-results.component';
import { SurveyService } from '../survey/services/survey.service';
import { Survey, SurveyStatusEnum } from '../survey/models/survey.model';
import { environment } from '../../environments/environment';

export type AdminTab = 'metrics' | 'home' | 'events' | 'news' | 'polls' | 'users' | 'settings';

export const ADMIN_ROUTE_TAB_MAP: Record<string, AdminTab> = {
  'metricas': 'metrics',
  'metrics': 'metrics',
  'home': 'metrics',
  'inicio': 'metrics',
  'eventos': 'events',
  'events': 'events',
  'noticias': 'news',
  'news': 'news',
  'encuestas': 'polls',
  'polls': 'polls',
  'usuarios': 'users',
  'users': 'users',
  'configuracion': 'settings',
  'settings': 'settings',
};

export const ADMIN_TAB_TO_ROUTE: Record<AdminTab, string> = {
  'metrics': 'metricas',
  'home': 'metricas',
  'events': 'eventos',
  'news': 'noticias',
  'polls': 'encuestas',
  'users': 'usuarios',
  'settings': 'configuracion',
};

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

export interface TagItem {
  id: number;
  name: string;
  color: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserItem {
  uuid: string;
  name: string;
  email: string;
  rol?: { name: string };
  role?: string;
  tag?: TagItem | null;
  tags?: TagItem[];
  avatar?: string;
}

interface Publication {
  uuid: string;
  title: string;
  content?: string;
  author?: { name: string; rol?: { name: string } };
  createdAt?: string;
}

export interface TopPageStat {
  path: string;
  visits: number;
  percentage: number;
}

export interface DailyVisitStat {
  date: string;
  visits: number;
  uniqueVisitors: number;
}

export interface VisitStats {
  totalVisits: number;
  uniqueVisitors: number;
  visitsToday: number;
  uniqueVisitorsToday: number;
  topPages: TopPageStat[];
  recentDays: DailyVisitStat[];
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    SurveyBuilderComponent,
    SurveyResultsComponent,
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly formBuilder = inject(FormBuilder);
  private readonly surveyService = inject(SurveyService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly authService = inject(AuthService);

  private readonly eventsApiUrl = `${environment.apiUrl}/events`;
  private readonly publicationsApiUrl = `${environment.apiUrl}/publications`;
  private readonly usersApiUrl = `${environment.apiUrl}/users`;
  private readonly tagsApiUrl = `${environment.apiUrl}/tag`;
  private readonly visitsApiUrl = `${environment.apiUrl}/visits/stats`;

  readonly visitStats = signal<VisitStats | null>(null);

  // Pestaña activa del panel, sincronizada con la URL
  readonly activeTab = signal<AdminTab>('metrics');

  // Modal para ver tarjeta abierta completa
  readonly selectedEventDetail = signal<AdminEventItem | null>(null);

  // Formulario de eventos con los campos listos para creación desde el dashboard
  readonly eventForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    subtitle: ['', [Validators.required]],
    dateDay: ['', [Validators.required, Validators.maxLength(2)]],
    dateMonth: ['OCT', [Validators.required]],
    time: ['', [Validators.required]],
    location: ['', [Validators.required]],
    city: ['', [Validators.required]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    imageUrl: ['', [Validators.required]],
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
  publications = signal<Publication[]>([]);

  // Gestión de Usuarios (RF-05 / Admin)
  users = signal<UserItem[]>([]);
  readonly userSearchTerm = signal<string>('');
  readonly userRoleFilter = signal<string>('all');
  readonly userTagFilter = signal<string>('all');

  // Gestión de Etiquetas (Tags)
  tags = signal<TagItem[]>([]);
  readonly isTagModalOpen = signal<boolean>(false);
  readonly newTagName = signal<string>('');
  readonly newTagColor = signal<string>('#7C3AED');
  readonly isCreatingTag = signal<boolean>(false);

  // Modal de Asignación Múltiple de Tags a un Usuario
  readonly selectedUserForTags = signal<UserItem | null>(null);
  readonly selectedUserTagIds = signal<number[]>([]);
  readonly userTagsSearchTerm = signal<string>('');
  readonly isSavingUserTags = signal<boolean>(false);

  readonly filteredModalTags = computed<TagItem[]>(() => {
    const list = this.tags() || [];
    const term = this.userTagsSearchTerm().trim().toLowerCase();
    if (!term) return list;
    return list.filter((t) => t.name.toLowerCase().includes(term));
  });

  // Paleta de colores predefinidos sugeridos para etiquetas
  readonly presetColors: string[] = [
    '#7C3AED', // Morado Intenso
    '#2563EB', // Azul Cobalto
    '#0284C7', // Azul Océano
    '#0D9488', // Teal
    '#059669', // Esmeralda
    '#16A34A', // Verde
    '#D97706', // Ámbar
    '#EA580C', // Naranja Fuego
    '#DC2626', // Rojo Carmesí
    '#DB2777', // Rosa Fucsia
    '#475569', // Grafito Pizarra
    '#0F172A', // Medianoche
  ];

  // Gestión de Encuestas (RF-17 / RF-18)
  surveys = signal<Survey[]>([]);
  selectedSurveyResultsId = signal<number | null>(null);
  currentSurveyPage = signal<number>(1);
  surveysPerPage = 5;

  readonly totalSurveyPages = computed(() => {
    return Math.max(1, Math.ceil(this.surveys().length / this.surveysPerPage));
  });

  readonly paginatedSurveys = computed(() => {
    const startIndex = (this.currentSurveyPage() - 1) * this.surveysPerPage;
    return this.surveys().slice(startIndex, startIndex + this.surveysPerPage);
  });

  readonly surveyPageNumbers = computed(() => {
    return Array.from({ length: this.totalSurveyPages() }, (_, i) => i + 1);
  });

  // --- MÉTRICAS Y ANALÍTICAS COMPUTADAS ---
  readonly totalEventsCount = computed(() => this.activeEvents().length + this.pastEvents().length);

  readonly publishedSurveysCount = computed(() => {
    return this.surveys().filter((s) => s.status === SurveyStatusEnum.PUBLISHED).length;
  });

  readonly draftSurveysCount = computed(() => {
    return this.surveys().filter((s) => s.status === SurveyStatusEnum.DRAFT).length;
  });

  readonly closedSurveysCount = computed(() => {
    return this.surveys().filter((s) => s.status === SurveyStatusEnum.CLOSED).length;
  });

  readonly totalSurveyQuestionsCount = computed(() => {
    return this.surveys().reduce((acc, s) => acc + (s.questions ? s.questions.length : 0), 0);
  });

  readonly adminUsersCount = computed(() => {
    return this.users().filter((u) => {
      const r = (u.rol?.name || u.role || '').toLowerCase();
      return r.includes('admin');
    }).length;
  });

  readonly moderatorUsersCount = computed(() => {
    return this.users().filter((u) => {
      const r = (u.rol?.name || u.role || '').toLowerCase();
      return r.includes('moder') || r.includes('editor');
    }).length;
  });

  readonly standardUsersCount = computed(() => {
    const total = this.users().length;
    const privileged = this.adminUsersCount() + this.moderatorUsersCount();
    return Math.max(0, total - privileged);
  });

  readonly usersWithTagsCount = computed(() => {
    return this.users().filter((u) => (u.tags && u.tags.length > 0) || !!u.tag).length;
  });

  readonly tagCoveragePercentage = computed(() => {
    const total = this.users().length;
    if (!total) return 0;
    return Math.round((this.usersWithTagsCount() / total) * 100);
  });

  readonly totalPlatformRecords = computed(() => {
    return (
      this.totalEventsCount() +
      this.publications().length +
      this.surveys().length +
      this.users().length
    );
  });

  readonly contentDistribution = computed(() => {
    const events = this.totalEventsCount();
    const news = this.publications().length;
    const polls = this.surveys().length;
    const total = events + news + polls;
    if (!total) {
      return { eventsPct: 33, newsPct: 33, pollsPct: 34, total: 0 };
    }
    const eventsPct = Math.round((events / total) * 100);
    const newsPct = Math.round((news / total) * 100);
    const pollsPct = Math.max(0, 100 - eventsPct - newsPct);
    return { eventsPct, newsPct, pollsPct, total };
  });

  readonly donutGradient = computed(() => {
    const dist = this.contentDistribution();
    if (dist.total === 0) {
      return 'conic-gradient(#cbd5e1 0% 100%)';
    }
    const p1 = dist.eventsPct;
    const p2 = p1 + dist.newsPct;
    return `conic-gradient(#ea580c 0% ${p1}%, #0284c7 ${p1}% ${p2}%, #10b981 ${p2}% 100%)`;
  });

  readonly maxDailyVisits = computed(() => {
    const days = this.visitStats()?.recentDays || [];
    if (!days.length) return 1;
    const max = Math.max(...days.map(d => d.visits));
    return max > 0 ? max : 1;
  });

  formatPagePath(path: string): string {
    if (!path || path === '/') return 'Inicio / Portada Principal';
    if (path === '/events' || path.startsWith('/events')) return 'Catálogo de Eventos';
    if (path === '/news' || path.startsWith('/news')) return 'Noticias y Artículos';
    if (path === '/polls' || path.startsWith('/polls')) return 'Encuestas y Votaciones';
    if (path === '/login') return 'Inicio de Sesión';
    if (path === '/register') return 'Registro de Nuevos Usuarios';
    return path;
  }

  formatShortDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  getDayBarHeight(visits: number): number {
    const max = this.maxDailyVisits();
    if (!visits || visits <= 0) return 6;
    return Math.max(14, Math.round((visits / max) * 100));
  }

  get dailyAverageVisits(): number {
    const days = this.visitStats()?.recentDays;
    if (!days || !days.length) return 0;
    const sum = days.reduce((acc, d) => acc + d.visits, 0);
    return Math.round(sum / days.length);
  }


  getUserTags(user: UserItem): TagItem[] {
    const activeTags = this.tags() || [];
    const activeTagIds = new Set(activeTags.map((t) => t.id));

    if (user.tags && Array.isArray(user.tags)) {
      if (activeTagIds.size > 0) {
        return user.tags.filter((t) => t && t.id && activeTagIds.has(t.id));
      }
      return user.tags.filter((t) => t && t.id && t.name);
    }
    if (user.tag && user.tag.id && user.tag.name) {
      if (activeTagIds.size > 0 && !activeTagIds.has(user.tag.id)) {
        return [];
      }
      return [user.tag];
    }
    return [];
  }

  readonly filteredUsers = computed<UserItem[]>(() => {
    const list = this.users() || [];
    const roleFilter = (this.userRoleFilter() || 'all').toLowerCase();
    const tagFilter = this.userTagFilter() || 'all';
    const term = (this.userSearchTerm() || '').trim().toLowerCase();

    return list.filter((u) => {
      const userRole = (u.rol?.name || u.role || 'user').toString().toLowerCase();
      const matchesRole = roleFilter === 'all' || userRole === roleFilter;

      const userTags = this.getUserTags(u);
      const matchesTag =
        tagFilter === 'all' ||
        (tagFilter === 'none' && userTags.length === 0) ||
        userTags.some((t) => t.id.toString() === tagFilter);

      const matchesSearch =
        !term ||
        (u.name && u.name.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term)) ||
        userTags.some((t) => t.name.toLowerCase().includes(term));

      return matchesRole && matchesTag && matchesSearch;
    });
  });

  resetUserFilters(): void {
    this.userSearchTerm.set('');
    this.userRoleFilter.set('all');
    this.userTagFilter.set('all');
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
    // Sincronizar pestaña activa con la subruta en la URL (/admin/:tab)
    this.route.paramMap.subscribe((params) => {
      const tabParam = (params.get('tab') || '').toLowerCase().trim();
      if (tabParam && ADMIN_ROUTE_TAB_MAP[tabParam]) {
        const mappedTab = ADMIN_ROUTE_TAB_MAP[tabParam];
        this.applyTab(mappedTab);
      } else if (!tabParam) {
        void this.router.navigate(['/admin', 'metricas'], { replaceUrl: true });
      } else {
        void this.router.navigate(['/admin', 'metricas'], { replaceUrl: true });
      }
    });

    // Conectar cambios del formulario al signal reactivo
    this.eventForm.valueChanges.subscribe(() => {
      this.formValueSignal.set(this.eventForm.getRawValue());
    });
  }

  setTab(tab: AdminTab): void {
    const routeName = this.tabToRoute(tab);
    void this.router.navigate(['/admin', routeName]);
  }

  tabToRoute(tab: AdminTab): string {
    return ADMIN_TAB_TO_ROUTE[tab] || 'metricas';
  }

  private applyTab(tab: AdminTab): void {
    this.activeTab.set(tab);
    this.clearAlerts();
    if (tab === 'users') {
      this.loadUsers();
      this.loadTags();
    } else if (tab === 'polls') {
      this.loadSurveys();
    } else if (tab === 'news') {
      this.loadPublications();
    } else if (tab === 'events') {
      this.loadEvents();
    } else if (tab === 'metrics' || tab === 'home') {
      this.loadEvents();
      this.loadPublications();
      this.loadUsers();
      this.loadTags();
      this.loadSurveys();
      this.loadVisitStats();
    }
  }

  loadVisitStats(): void {
    this.http.get<VisitStats>(this.visitsApiUrl).subscribe({
      next: (data) => {
        this.visitStats.set(data);
      },
      error: () => {
        // Silencioso o mantener estado previo si la API no responde
      },
    });
  }

  loadSurveys(): void {
    this.surveyService.getSurveys().subscribe({
      next: (data) => {
        this.surveys.set(data || []);
        if (this.currentSurveyPage() > this.totalSurveyPages()) {
          this.currentSurveyPage.set(this.totalSurveyPages());
        }
      },
      error: () => {
        this.error = 'No fue posible cargar las encuestas dinámicas.';
      },
    });
  }

  prevSurveyPage(): void {
    if (this.currentSurveyPage() > 1) {
      this.currentSurveyPage.update(p => p - 1);
    }
  }

  nextSurveyPage(): void {
    if (this.currentSurveyPage() < this.totalSurveyPages()) {
      this.currentSurveyPage.update(p => p + 1);
    }
  }

  goToSurveyPage(page: number): void {
    if (page >= 1 && page <= this.totalSurveyPages()) {
      this.currentSurveyPage.set(page);
    }
  }

  toggleSurveyResults(id: number): void {
    if (this.selectedSurveyResultsId() === id) {
      this.selectedSurveyResultsId.set(null);
    } else {
      this.selectedSurveyResultsId.set(id);
    }
  }

  toggleSurveyStatus(survey: Survey): void {
    this.clearAlerts();
    const isCurrentlyPublished = survey.status === 'PUBLISHED';
    const newStatus = isCurrentlyPublished ? SurveyStatusEnum.CLOSED : SurveyStatusEnum.PUBLISHED;
    const payload: any = { status: newStatus };
    if (newStatus === SurveyStatusEnum.CLOSED) {
      payload.endDate = new Date().toISOString();
    }

    this.surveyService.updateSurvey(survey.index, payload).subscribe({
      next: () => {
        this.message = isCurrentlyPublished
          ? 'Encuesta deshabilitada correctamente. Ya no estará visible para los votantes.'
          : 'Encuesta habilitada y publicada nuevamente.';
        this.loadSurveys();
        this.clearAlertsSoon();
      },
      error: () => {
        this.error = 'No fue posible cambiar el estado de la encuesta.';
      },
    });
  }

  deleteSurvey(id: number): void {
    this.clearAlerts();
    if (!confirm('¿Estás seguro de que deseas eliminar definitivamente esta encuesta?')) return;
    this.surveyService.deleteSurvey(id).subscribe({
      next: () => {
        this.message = 'Encuesta eliminada exitosamente.';
        if (this.selectedSurveyResultsId() === id) {
          this.selectedSurveyResultsId.set(null);
        }
        this.loadSurveys();
        this.clearAlertsSoon();
      },
      error: () => {
        this.error = 'No tienes permiso para eliminar esta encuesta.';
      },
    });
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
    this.http.get<{ data: Publication[] }>(`${this.publicationsApiUrl}?limit=100`, this.options).subscribe({
      next: response => {
        this.publications.set(response.data || []);
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

  // # Este bloque tiene como objetivo cambiar el rol de un usuario, actualizar la sesión en tiempo real si es la cuenta propia y sacar al usuario al Home si perdió privilegios de administración
  changeUserRole(uuid: string, newRole: string): void {
    this.clearAlerts();
    const currentUser = this.authService.getUser();
    const targetUser = this.users().find((u) => u.uuid === uuid);

    this.http.patch(`${this.usersApiUrl}/${uuid}/role`, { role: newRole }, this.options).subscribe({
      next: () => {
        this.message = 'Rol de usuario actualizado correctamente.';
        this.loadUsers();

        // Verificar si se modificó la cuenta con la que actualmente se tiene la sesión iniciada
        const isSelf = !!(currentUser && targetUser && (
          (targetUser.email && currentUser.email && targetUser.email.toLowerCase() === currentUser.email.toLowerCase()) ||
          (targetUser.uuid === (currentUser as any).uuid)
        ));

        if (isSelf) {
          this.authService.updateCurrentUserRole(newRole);

          // Si el nuevo rol ya no es administrativo ('admin' o 'mod'), redirigir automáticamente fuera del panel al Home
          if (newRole !== 'admin' && newRole !== 'mod') {
            this.router.navigate(['/']);
            return;
          }
        }

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

  /* ------------------------------------------------------------------------
   * MÉTODOS DE GESTIÓN DE TAGS / ETIQUETAS
   * ------------------------------------------------------------------------ */
  loadTags(): void {
    this.http.get<TagItem[]>(this.tagsApiUrl).subscribe({
      next: (data) => {
        this.tags.set(data || []);
      },
      error: () => {
        // En caso de fallo de red
      },
    });
  }

  openCreateTagModal(): void {
    this.newTagName.set('');
    this.newTagColor.set('#7C3AED');
    this.isTagModalOpen.set(true);
  }

  closeCreateTagModal(): void {
    this.isTagModalOpen.set(false);
    this.newTagName.set('');
  }

  selectPresetColor(color: string): void {
    this.newTagColor.set(color);
  }

  onHexColorInput(event: Event): void {
    let hex = (event.target as HTMLInputElement).value.trim();
    if (!hex.startsWith('#') && hex.length > 0) {
      hex = '#' + hex;
    }
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      this.newTagColor.set(hex);
    }
  }

  createTag(): void {
    this.clearAlerts();
    const name = this.newTagName().trim();
    let color = this.newTagColor().trim();

    if (!name) {
      this.error = 'Debes ingresar un nombre para la etiqueta.';
      return;
    }

    if (!color.startsWith('#')) {
      color = '#' + color;
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      this.error = 'El color debe ser un código hexadecimal válido de 6 caracteres (ej. #7C3AED).';
      return;
    }

    this.isCreatingTag.set(true);
    this.http.post<TagItem>(this.tagsApiUrl, { name, color }, this.options).subscribe({
      next: (createdTag) => {
        this.isCreatingTag.set(false);
        this.message = `Etiqueta "${createdTag?.name || name}" creada exitosamente.`;
        if (createdTag && createdTag.id) {
          const current = this.tags();
          if (!current.some((t) => t.id === createdTag.id)) {
            this.tags.set([...current, createdTag]);
          }
        }
        this.closeCreateTagModal();
        this.loadTags();
        this.clearAlertsSoon();
      },
      error: (err) => {
        this.isCreatingTag.set(false);
        this.error = err?.error?.message || 'No fue posible crear la etiqueta.';
      },
    });
  }

  deleteTag(id: number, name: string): void {
    this.clearAlerts();
    if (!confirm(`¿Estás seguro de que deseas eliminar la etiqueta "${name}"? Se desvinculará de todos los usuarios.`)) return;

    // Actualización inmediata en memoria para reflejar la eliminación sin demora
    this.tags.set(this.tags().filter((t) => t.id !== id));
    this.users.set(
      this.users().map((u) => ({
        ...u,
        tags: (u.tags || []).filter((t) => t.id !== id),
        tag: u.tag && u.tag.id === id ? null : u.tag,
      }))
    );

    this.http.delete(`${this.tagsApiUrl}/${id}`, this.options).subscribe({
      next: () => {
        this.message = `Etiqueta "${name}" eliminada correctamente.`;
        this.loadTags();
        this.loadUsers();
        this.clearAlertsSoon();
      },
      error: (err) => {
        this.error = err?.error?.message || 'No fue posible eliminar la etiqueta.';
        this.loadTags();
        this.loadUsers();
      },
    });
  }

  /* ------------------------------------------------------------------------
   * MÉTODOS DE ASIGNACIÓN MÚLTIPLE DE TAGS A UN USUARIO
   * ------------------------------------------------------------------------ */
  openUserTagsModal(user: UserItem): void {
    this.selectedUserForTags.set(user);
    const existingTags = this.getUserTags(user);
    this.selectedUserTagIds.set(existingTags.map((t) => t.id));
    this.userTagsSearchTerm.set('');
  }

  closeUserTagsModal(): void {
    this.selectedUserForTags.set(null);
    this.selectedUserTagIds.set([]);
    this.userTagsSearchTerm.set('');
  }

  toggleTagSelection(tagId: number): void {
    const current = this.selectedUserTagIds();
    if (current.includes(tagId)) {
      this.selectedUserTagIds.set(current.filter((id) => id !== tagId));
    } else {
      this.selectedUserTagIds.set([...current, tagId]);
    }
  }

  isTagSelected(tagId: number): boolean {
    return this.selectedUserTagIds().includes(tagId);
  }

  selectAllTagsInModal(): void {
    const visibleIds = this.filteredModalTags().map((t) => t.id);
    const current = new Set(this.selectedUserTagIds());
    visibleIds.forEach((id) => current.add(id));
    this.selectedUserTagIds.set(Array.from(current));
  }

  clearAllTagsInModal(): void {
    this.selectedUserTagIds.set([]);
  }

  saveUserTags(): void {
    const user = this.selectedUserForTags();
    if (!user) return;

    this.clearAlerts();
    this.isSavingUserTags.set(true);

    const tagIds = this.selectedUserTagIds();
    const updatedTags = this.tags().filter((t) => tagIds.includes(t.id));

    this.http.patch(`${this.usersApiUrl}/${user.uuid}/tags`, { tagIds }, this.options).subscribe({
      next: () => {
        this.isSavingUserTags.set(false);
        this.message = `Etiquetas de "${user.name}" actualizadas con éxito (${tagIds.length} asignadas).`;

        // Actualización inmediata del usuario en memoria para respuesta instantánea
        this.users.set(
          this.users().map((u) => {
            if (u.uuid === user.uuid) {
              return {
                ...u,
                tags: updatedTags,
                tag: updatedTags.length > 0 ? updatedTags[0] : null,
              };
            }
            return u;
          })
        );

        this.closeUserTagsModal();
        this.loadUsers();
        this.clearAlertsSoon();
      },
      error: (err) => {
        this.isSavingUserTags.set(false);
        this.error = err?.error?.message || 'No fue posible guardar las etiquetas del usuario.';
      },
    });
  }

  getUserCountForTag(tagId: number): number {
    return (this.users() || []).filter((u) => this.getUserTags(u).some((t) => t.id === tagId)).length;
  }

  getContrastColor(hexColor: string | undefined): string {
    if (!hexColor) return '#ffffff';
    let hex = hexColor.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    if (hex.length !== 6) return '#ffffff';

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 150) ? '#0f172a' : '#ffffff';
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

        // Restablecer el formulario limpio para el próximo evento
        this.eventForm.reset({
          title: '',
          subtitle: '',
          dateDay: '',
          dateMonth: 'OCT',
          time: '',
          location: '',
          city: '',
          description: '',
          imageUrl: '',
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
          this.error = `No fue posible guardar el evento en el servidor (${this.eventsApiUrl}).`;
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
    if (!this.authService.hasManagementRole() || this.publicationForm.invalid) return;
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

