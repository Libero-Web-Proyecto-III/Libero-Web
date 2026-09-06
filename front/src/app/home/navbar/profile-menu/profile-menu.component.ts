import { Component, ElementRef, HostListener, computed, inject, output, signal } from '@angular/core';
import { Router } from '@angular/router';

export type ProfileRole = 'Invitado' | 'Usuario' | 'Administrador';

interface ProfileData {
  name: string;
  email: string;
  role: ProfileRole;
  initials: string;
}

@Component({
  selector: 'app-profile-menu',
  standalone: true,
  templateUrl: './profile-menu.component.html',
  styleUrl: './profile-menu.component.scss',
})
export class ProfileMenuComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);

  readonly profileRequested = output<void>();
  readonly administrationRequested = output<void>();

  readonly isOpen = signal(false);
  readonly selectedRole = signal<ProfileRole>('Invitado');

  readonly profileByRole: Record<ProfileRole, ProfileData> = {
    Invitado: {
      name: 'Usuarioinvitado',
      email: '',
      role: 'Invitado',
      initials: '?',
    },
    Usuario: {
      name: 'Nombre de usuario',
      email: 'correo@usuario.com',
      role: 'Usuario',
      initials: 'U',
    },
    Administrador: {
      name: 'Administrador',
      email: 'admin@ejemplo.com',
      role: 'Administrador',
      initials: 'A',
    },
  };

  readonly currentProfile = computed(() => this.profileByRole[this.selectedRole()]);

  toggleMenu(): void {
    this.isOpen.update(open => !open);
  }

  selectRole(event: Event): void {
    const role = (event.target as HTMLSelectElement).value as ProfileRole;
    this.selectedRole.set(role);
  }

  closeMenu(): void {
    this.isOpen.set(false);
  }

  signOut(): void {
    this.selectedRole.set('Invitado');
  }

  requestProfile(): void {
    this.profileRequested.emit();
    this.closeMenu();
  }

  requestAdministration(): void {
    this.administrationRequested.emit();
    this.closeMenu();
  }

  goToLogin(): void {
    this.closeMenu();
    void this.router.navigate(['/auth/login']);
  }

  goToRegister(): void {
    this.closeMenu();
    void this.router.navigate(['/auth/register']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.closeMenu();
    }
  }
}
