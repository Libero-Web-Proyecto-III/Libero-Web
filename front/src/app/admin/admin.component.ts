import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { SurveyBuilderComponent } from '../survey/components/survey-builder/survey-builder.component';
import { SurveyResultsComponent } from '../survey/components/survey-results/survey-results.component';
import { SurveyService } from '../survey/services/survey.service';
import { Survey, SurveyStatusEnum } from '../survey/models/survey.model';

interface Publication { uuid: string; title: string; media?: string[]; author?: { name: string; rol?: { name: string } } }
interface EventItem { uuid: string; title: string; image?: string; organizer?: { name: string; rol?: { name: string } } }
interface UserItem { uuid: string; name: string; email: string; rol?: { name: string } }

// # Este bloque tiene como objetivo centralizar el panel de administración global con gestión de encuestas, usuarios, publicaciones y eventos
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
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly surveyService = inject(SurveyService);
  readonly authService = inject(AuthService);

  readonly publicationForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    content: ['', Validators.required],
    image: [''],
  });
  readonly eventForm = this.formBuilder.nonNullable.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    image: [''],
  });

  publications: Publication[] = [];
  events: EventItem[] = [];
  surveys: Survey[] = [];
  users: UserItem[] = [];
  userSearchTerm = '';
  userRoleFilter = 'all';
  selectedSurveyResultsId: number | null = null;

  // # Este bloque tiene como objetivo controlar la paginación del listado de encuestas en el panel de administración (5 encuestas por página)
  currentSurveyPage = 1;
  surveysPerPage = 5;

  message = '';
  error = '';

  ngOnInit(): void {
    this.loadContent();
  }

  // # Este bloque tiene como objetivo leer y convertir a Base64 la imagen seleccionada para una nueva publicación
  onPublicationImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.publicationForm.patchValue({ image: reader.result as string });
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }
  }

  // # Este bloque tiene como objetivo leer y convertir a Base64 la imagen seleccionada para un nuevo evento
  onEventImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.eventForm.patchValue({ image: reader.result as string });
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }
  }

  // # Este bloque tiene como objetivo filtrar dinámicamente el listado de usuarios por término de búsqueda (nombre/correo) y por rol seleccionado de forma reactiva
  get filteredUsers(): UserItem[] {
    const list = this.users || [];
    const filter = (this.userRoleFilter || 'all').toLowerCase();
    const term = (this.userSearchTerm || '').trim().toLowerCase();

    return list.filter((u) => {
      const userRole = (u.rol?.name || (u as any).role || 'user').toString().toLowerCase();
      const matchesRole = filter === 'all' || userRole === filter;
      const matchesSearch =
        !term ||
        (u.name && u.name.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term));

      return matchesRole && matchesSearch;
    });
  }

  private get options() {
    return { headers: new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` }) };
  }

  // # Este bloque tiene como objetivo cargar las publicaciones, eventos, encuestas y lista de usuarios registrados
  loadContent(): void {
    this.http.get<{ data: Publication[] }>('http://localhost:3000/publications', this.options).subscribe({
      next: response => { this.publications = response.data; this.cdr.markForCheck(); },
      error: () => this.error = 'No fue posible cargar las publicaciones.',
    });

    this.http.get<EventItem[]>('http://localhost:3000/events', this.options).subscribe({
      next: response => { this.events = response; this.cdr.markForCheck(); },
      error: () => this.error = 'No fue posible cargar los eventos.',
    });

    this.loadSurveys();
    this.loadUsers();
  }

  // # Este bloque tiene como objetivo cargar el listado de encuestas dinámicas desde la API y ajustar el límite de página actual
  loadSurveys(): void {
    this.surveyService.getSurveys().subscribe({
      next: (data) => {
        this.surveys = data || [];
        if (this.currentSurveyPage > this.totalSurveyPages) {
          this.currentSurveyPage = this.totalSurveyPages;
        }
        this.cdr.markForCheck();
      },
      error: () => this.error = 'No fue posible cargar las encuestas dinámicas.',
    });
  }

  // # Este bloque tiene como objetivo proporcionar la lista segmentada de encuestas para la página actual (5 encuestas por página)
  get paginatedSurveys(): Survey[] {
    const startIndex = (this.currentSurveyPage - 1) * this.surveysPerPage;
    return this.surveys.slice(startIndex, startIndex + this.surveysPerPage);
  }

  get totalSurveyPages(): number {
    return Math.max(1, Math.ceil(this.surveys.length / this.surveysPerPage));
  }

  get surveyPageNumbers(): number[] {
    return Array.from({ length: this.totalSurveyPages }, (_, i) => i + 1);
  }

  prevSurveyPage(): void {
    if (this.currentSurveyPage > 1) {
      this.currentSurveyPage--;
      this.cdr.markForCheck();
    }
  }

  nextSurveyPage(): void {
    if (this.currentSurveyPage < this.totalSurveyPages) {
      this.currentSurveyPage++;
      this.cdr.markForCheck();
    }
  }

  goToSurveyPage(page: number): void {
    if (page >= 1 && page <= this.totalSurveyPages) {
      this.currentSurveyPage = page;
      this.cdr.markForCheck();
    }
  }

  // # Este bloque tiene como objetivo cargar el listado completo de usuarios registrados para administración (RF-05 / Admin) asegurando actualización de vista en recargas
  loadUsers(): void {
    if (!this.authService.getToken()) return;
    this.http.get<{ data: UserItem[] }>('http://localhost:3000/users?limit=100', this.options).subscribe({
      next: (res) => {
        this.users = res.data || [];
        this.cdr.markForCheck();
      },
      error: () => this.error = 'No fue posible cargar el listado de usuarios.',
    });
  }

  // # Este bloque tiene como objetivo permitir al Administrador promover o cambiar el rol de un usuario (ej. promover de user a admin)
  changeUserRole(uuid: string, newRole: string): void {
    this.http.patch(`http://localhost:3000/users/${uuid}/role`, { role: newRole }, this.options).subscribe({
      next: () => {
        this.message = 'Rol de usuario actualizado correctamente.';
        this.loadUsers();
      },
      error: () => this.error = 'No fue posible cambiar el rol del usuario.',
    });
  }

  // # Este bloque tiene como objetivo permitir al Administrador eliminar a un usuario registrado
  deleteUserAccount(uuid: string): void {
    this.http.delete(`http://localhost:3000/users/${uuid}`, this.options).subscribe({
      next: () => {
        this.message = 'Usuario eliminado del sistema.';
        this.loadUsers();
      },
      error: () => this.error = 'No fue posible eliminar al usuario.',
    });
  }

  // # Este bloque tiene como objetivo alternar la visualización del tablero de estadísticas de encuestas
  toggleSurveyResults(id: number): void {
    if (this.selectedSurveyResultsId === id) {
      this.selectedSurveyResultsId = null;
    } else {
      this.selectedSurveyResultsId = id;
    }
  }

  createPublication(): void {
    if (!this.authService.isAdmin() || this.publicationForm.invalid) return;
    const formVal = this.publicationForm.getRawValue();
    const payload: any = {
      title: formVal.title,
      content: formVal.content,
      media: formVal.image ? [formVal.image] : [],
    };

    this.http.post('http://localhost:3000/publications', payload, this.options).subscribe({
      next: () => { this.message = 'Publicación creada con imagen.'; this.publicationForm.reset(); this.loadContent(); },
      error: () => this.error = 'No fue posible crear la publicación.',
    });
  }

  createEvent(): void {
    if (!this.authService.isAdmin() || this.eventForm.invalid) return;
    const formVal = this.eventForm.getRawValue();
    const payload: any = {
      title: formVal.title,
      description: formVal.description,
      startDate: formVal.startDate,
      endDate: formVal.endDate,
      image: formVal.image || null,
    };

    this.http.post('http://localhost:3000/events', payload, this.options).subscribe({
      next: () => { this.message = 'Evento creado con imagen.'; this.eventForm.reset(); this.loadContent(); },
      error: () => this.error = 'No fue posible crear el evento.',
    });
  }

  deletePublication(uuid: string): void {
    this.http.delete(`http://localhost:3000/publications/${uuid}`, this.options).subscribe({
      next: () => { this.message = 'Publicación eliminada.'; this.loadContent(); },
      error: () => this.error = 'No tienes permiso para eliminar esta publicación.',
    });
  }

  deleteEvent(uuid: string): void {
    this.http.delete(`http://localhost:3000/events/${uuid}`, this.options).subscribe({
      next: () => { this.message = 'Evento eliminado.'; this.loadContent(); },
      error: () => this.error = 'No tienes permiso para eliminar este evento.',
    });
  }

  deleteSurvey(id: number): void {
    this.surveyService.deleteSurvey(id).subscribe({
      next: () => {
        this.message = 'Encuesta eliminada exitosamente.';
        if (this.selectedSurveyResultsId === id) {
          this.selectedSurveyResultsId = null;
        }
        this.loadSurveys();
      },
      error: () => this.error = 'No tienes permiso para eliminar esta encuesta.',
    });
  }

  // # Este bloque tiene como objetivo permitir al Administrador deshabilitar o habilitar una encuesta existente para controlar su visibilidad pública y vigencia
  toggleSurveyStatus(survey: Survey): void {
    const isCurrentlyPublished = survey.status === 'PUBLISHED';
    const newStatus = isCurrentlyPublished ? SurveyStatusEnum.CLOSED : SurveyStatusEnum.PUBLISHED;
    const payload: any = { status: newStatus };
    if (newStatus === SurveyStatusEnum.CLOSED) {
      payload.endDate = new Date().toISOString();
    }

    this.surveyService.updateSurvey(survey.index, payload).subscribe({
      next: () => {
        this.message = isCurrentlyPublished
          ? 'Encuesta deshabilitada correctamente. Ya no estará visible para los usuarios e invitados.'
          : 'Encuesta habilitada y publicada nuevamente.';
        this.loadSurveys();
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'No fue posible cambiar el estado de la encuesta.';
        this.cdr.markForCheck();
      },
    });
  }
}
