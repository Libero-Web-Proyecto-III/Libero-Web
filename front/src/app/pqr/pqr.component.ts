import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NavbarComponent } from '../common/navbar/navbar.component';
import { FooterComponent } from '../common/footer/footer.component';
import { Pqr, PqrStatus, PqrType } from './pqr.model';
import { PqrService } from './services/pqr.service';
import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-pqr',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
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

  // Pestañas activas: 'radicar' o 'consultar'
  activeTab = signal<'radicar' | 'consultar'>('radicar');

  // Formulario de radicación de PQR
  isAnonymous = signal(false);
  formFullName = signal('');
  formEmail = signal('');
  formPhone = signal('');
  formType = signal<PqrType>('peticion');
  formSubject = signal('');
  formMessage = signal('');
  sending = signal(false);
  sendError = signal<string | null>(null);

  // Modal de confirmación y código generado
  submittedRadicado = signal<string | null>(null);
  copySuccess = signal(false);
  sendSuccess = signal(false);

  // Pestaña de Consulta pública
  searchRadicado = signal('');
  consulting = signal(false);
  consultResult = signal<Pqr | null>(null);
  consultError = signal<string | null>(null);

  setTab(tab: 'radicar' | 'consultar') {
    this.activeTab.set(tab);
    this.sendError.set(null);
    this.consultError.set(null);
  }

  submitPqr() {
    const isAnon = this.isAnonymous();
    const subject = this.formSubject().trim();
    const message = this.formMessage().trim();

    if (!isAnon && !this.isLoggedIn()) {
      const name = this.formFullName().trim();
      const email = this.formEmail().trim();
      if (!name || !email) {
        this.sendError.set('Ingresa tu nombre y correo o marca la casilla de Envío Anónimo.');
        return;
      }
    }

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

    const payload: any = {
      phone: this.formPhone().trim() || undefined,
      isAnonymous: isAnon,
      type: this.formType(),
      subject,
      message
    };

    if (!isAnon && !this.isLoggedIn()) {
      payload.fullName = this.formFullName().trim() || undefined;
      payload.email = this.formEmail().trim() || undefined;
    }

    this.pqrService.create(payload).subscribe({
      next: (res) => {
        this.sending.set(false);
        const code = res?.radicado || 'MC-2026-0001';
        this.submittedRadicado.set(code);
        this.sendSuccess.set(true);
        this.copySuccess.set(false);

        // Reset fields
        this.formSubject.set('');
        this.formMessage.set('');
        this.formPhone.set('');
        this.formFullName.set('');
        this.formEmail.set('');
        this.isAnonymous.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.sending.set(false);
        this.sendError.set(err?.error?.message ?? 'No se pudo enviar tu PQR. Intenta de nuevo.');
      }
    });
  }

  closeModal() {
    this.submittedRadicado.set(null);
    this.sendSuccess.set(false);
    this.copySuccess.set(false);
  }

  dismissSuccess() {
    this.closeModal();
  }

  copyToClipboard(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 2500);
    }).catch(() => {
      this.copySuccess.set(true);
    });
  }

  consultar() {
    const code = this.searchRadicado().trim();
    if (!code) {
      this.consultError.set('Por favor ingresa un código de radicado.');
      this.consultResult.set(null);
      return;
    }

    this.consulting.set(true);
    this.consultError.set(null);
    this.consultResult.set(null);

    this.pqrService.consultarPorRadicado(code).subscribe({
      next: (pqr) => {
        this.consulting.set(false);
        this.consultResult.set(pqr);
      },
      error: (err: HttpErrorResponse) => {
        this.consulting.set(false);
        this.consultResult.set(null);
        if (err.status === 404) {
          this.consultError.set(`No se encontró ninguna solicitud con el radicado "${code}". Verifica el código e intenta nuevamente.`);
        } else {
          this.consultError.set(err?.error?.message ?? 'No se pudo consultar el radicado. Intenta más tarde.');
        }
      }
    });
  }

  getStatusBadgeClass(status?: PqrStatus): string {
    switch (status) {
      case 'resuelto': return 'status-resuelto';
      case 'en_revision': return 'status-en-revision';
      case 'rechazado': return 'status-rechazado';
      default: return 'status-pendiente';
    }
  }

  getStatusLabel(status?: PqrStatus): string {
    switch (status) {
      case 'resuelto': return 'Resuelto';
      case 'en_revision': return 'En Revisión';
      case 'rechazado': return 'Rechazado';
      default: return 'Pendiente';
    }
  }
}
