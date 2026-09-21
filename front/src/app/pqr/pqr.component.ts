import { Component, OnInit, computed, signal } from '@angular/core';
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
export class PqrComponent implements OnInit {
  readonly typeOptions: { value: PqrType; label: string }[] = [
    { value: 'peticion', label: 'Petición' },
    { value: 'queja', label: 'Queja' },
    { value: 'reclamo', label: 'Reclamo' },
    { value: 'sugerencia', label: 'Sugerencia' }
  ];

  readonly statusLabels: Record<PqrStatus, string> = {
    pendiente: 'Pendiente',
    en_revision: 'En revisión',
    resuelto: 'Resuelto',
    rechazado: 'Rechazado'
  };

  // Formulario público
  formFullName = signal('');
  formEmail = signal('');
  formPhone = signal('');
  formType = signal<PqrType>('peticion');
  formSubject = signal('');
  formMessage = signal('');
  sending = signal(false);
  sendError = signal<string | null>(null);
  sendSuccess = signal(false);

  // Panel de gestión
  showPanel = signal(false);
  pqrs = signal<Pqr[]>([]);
  panelLoading = signal(false);
  filterType = signal<PqrType | ''>('');
  filterStatus = signal<PqrStatus | ''>('');
  expandedUuid = signal<string | null>(null);
  statusDraft = signal<PqrStatus>('pendiente');
  responseDraft = signal('');
  updating = signal(false);
  updateError = signal<string | null>(null);

  constructor(private pqrService: PqrService, private authService: AuthService) {}

  canManagePqrs = computed(() => {
    const role = this.authService.currentUser()?.role?.toLowerCase();
    return role === 'mod' || role === 'admin';
  });

  ngOnInit(): void {
    if (this.canManagePqrs()) {
      this.loadPanel();
    }
  }

  togglePanel() {
    this.showPanel.update(v => !v);
    if (this.showPanel() && this.pqrs().length === 0) {
      this.loadPanel();
    }
  }

  loadPanel() {
    this.panelLoading.set(true);
    this.pqrService.findAll(1, 50, this.filterType() || undefined, this.filterStatus() || undefined).subscribe({
      next: (res) => {
        this.pqrs.set(res.data);
        this.panelLoading.set(false);
      },
      error: () => {
        this.panelLoading.set(false);
      }
    });
  }

  applyFilters() {
    this.loadPanel();
  }

  submitPqr() {
    const fullName = this.formFullName().trim();
    const email = this.formEmail().trim();
    const subject = this.formSubject().trim();
    const message = this.formMessage().trim();

    if (!fullName || !email || !subject || !message) {
      this.sendError.set('Completa todos los campos obligatorios.');
      return;
    }

    this.sending.set(true);
    this.sendError.set(null);

    this.pqrService.create({
      fullName,
      email,
      phone: this.formPhone().trim() || undefined,
      type: this.formType(),
      subject,
      message
    }).subscribe({
      next: () => {
        this.sending.set(false);
        this.sendSuccess.set(true);
        this.formFullName.set('');
        this.formEmail.set('');
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

  toggleExpand(pqr: Pqr) {
    if (this.expandedUuid() === pqr.uuid) {
      this.expandedUuid.set(null);
      return;
    }
    this.expandedUuid.set(pqr.uuid);
    this.statusDraft.set(pqr.status);
    this.responseDraft.set(pqr.response ?? '');
    this.updateError.set(null);
  }

  submitStatusUpdate(pqr: Pqr) {
    this.updating.set(true);
    this.updateError.set(null);

    this.pqrService.updateStatus(pqr.uuid, this.statusDraft(), this.responseDraft().trim() || undefined).subscribe({
      next: (updated) => {
        this.pqrs.update(list => list.map(p => (p.uuid === updated.uuid ? updated : p)));
        this.updating.set(false);
        this.expandedUuid.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.updating.set(false);
        this.updateError.set(err?.error?.message ?? 'No se pudo actualizar la PQR.');
      }
    });
  }
}