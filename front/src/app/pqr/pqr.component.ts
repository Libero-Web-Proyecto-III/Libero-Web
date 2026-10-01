import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { NavbarComponent } from '../common/navbar/navbar.component';
import { FooterComponent } from '../common/footer/footer.component';
import { PqrType } from './pqr.model';
import { PqrService } from './services/pqr.service';
import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-pqr',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './pqr.component.html',
  styleUrl: './pqr.component.scss'
})
export class PqrComponent {
  private readonly pqrService = inject(PqrService);
  public readonly authService = inject(AuthService);

  readonly typeOptions: { value: PqrType; label: string }[] = [
    { value: 'peticion', label: 'Petición' },
    { value: 'queja', label: 'Queja' },
    { value: 'reclamo', label: 'Reclamo' },
    { value: 'sugerencia', label: 'Sugerencia' }
  ];

  readonly currentUser = this.authService.currentUser;
  readonly isLoggedIn = this.authService.isLoggedIn;

  // Formulario de PQR
  isAnonymous = signal(false);
  formPhone = signal('');
  formType = signal<PqrType>('peticion');
  formSubject = signal('');
  formMessage = signal('');
  sending = signal(false);
  sendError = signal<string | null>(null);
  sendSuccess = signal(false);

  submitPqr() {
    if (!this.isLoggedIn()) {
      this.sendError.set('Debes iniciar sesión para registrar una solicitud PQR.');
      return;
    }

    const subject = this.formSubject().trim();
    const message = this.formMessage().trim();

    if (!subject || !message) {
      this.sendError.set('Completa todos los campos obligatorios (Asunto y Mensaje).');
      return;
    }

    if (subject.length < 5) {
      this.sendError.set('El asunto debe tener al menos 5 caracteres.');
      return;
    }

    if (message.length < 10) {
      this.sendError.set('El mensaje debe tener al menos 10 caracteres.');
      return;
    }

    this.sending.set(true);
    this.sendError.set(null);

    this.pqrService.create({
      phone: this.formPhone().trim() || undefined,
      isAnonymous: this.isAnonymous(),
      type: this.formType(),
      subject,
      message
    }).subscribe({
      next: () => {
        this.sending.set(false);
        this.sendSuccess.set(true);
        this.isAnonymous.set(false);
        this.formPhone.set('');
        this.formType.set('peticion');
        this.formSubject.set('');
        this.formMessage.set('');
      },
      error: (err: HttpErrorResponse) => {
        this.sending.set(false);
        this.sendError.set(err?.error?.message ?? 'No se pudo enviar tu PQR. Intenta de nuevo.');
      }
    });
  }

  dismissSuccess() {
    this.sendSuccess.set(false);
  }
}