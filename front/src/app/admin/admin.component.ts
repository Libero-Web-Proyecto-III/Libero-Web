import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

interface Publication { uuid: string; title: string; author?: { name: string; rol?: { name: string } } }
interface EventItem { uuid: string; title: string; organizer?: { name: string; rol?: { name: string } } }

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent {
  private readonly http = inject(HttpClient);
  private readonly formBuilder = inject(FormBuilder);
  readonly authService = inject(AuthService);
  readonly publicationForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    content: ['', Validators.required],
  });
  readonly eventForm = this.formBuilder.nonNullable.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
  });
  publications: Publication[] = [];
  events: EventItem[] = [];
  message = '';
  error = '';

  constructor() {
    this.loadContent();
  }

  private get options() {
    return { headers: new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` }) };
  }

  loadContent(): void {
    this.http.get<{ data: Publication[] }>('http://localhost:3000/publications', this.options).subscribe({
      next: response => this.publications = response.data,
      error: () => this.error = 'No fue posible cargar las publicaciones.',
    });
    this.http.get<EventItem[]>('http://localhost:3000/events', this.options).subscribe({
      next: response => this.events = response,
      error: () => this.error = 'No fue posible cargar los eventos.',
    });
  }

  createPublication(): void {
    if (!this.authService.isAdmin() || this.publicationForm.invalid) return;
    this.http.post('http://localhost:3000/publications', this.publicationForm.getRawValue(), this.options).subscribe({
      next: () => { this.message = 'Publicación creada.'; this.publicationForm.reset(); this.loadContent(); },
      error: () => this.error = 'No fue posible crear la publicación.',
    });
  }

  createEvent(): void {
    if (!this.authService.isAdmin() || this.eventForm.invalid) return;
    this.http.post('http://localhost:3000/events', this.eventForm.getRawValue(), this.options).subscribe({
      next: () => { this.message = 'Evento creado.'; this.eventForm.reset(); this.loadContent(); },
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
}
