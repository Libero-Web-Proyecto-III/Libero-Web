import { Component, ElementRef, HostListener, computed, inject, output, signal } from '@angular/core';
import { Router } from '@angular/router';

export type ProfileRole = 'Invitado' | 'Usuario' | 'Administrador';

// Datos que la tarjeta de perfil muestra según el rol seleccionado.
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
  // Referencias necesarias para cerrar el menú fuera del componente y navegar entre vistas.
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);

  // Eventos preparados para futuras pantallas de perfil y administración.
  readonly profileRequested = output<void>();
  readonly administrationRequested = output<void>();

  // Estado reactivo de apertura y rol temporal seleccionado para pruebas frontend.
  readonly isOpen = signal(false);
  readonly selectedRole = signal<ProfileRole>('Invitado');

  // Perfiles ficticios que alimentan la única tarjeta dinámica del menú.
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

  // Recalcula los datos visibles cada vez que cambia el rol seleccionado.
  readonly currentProfile = computed(() => this.profileByRole[this.selectedRole()]);

  // Abre o cierra la tarjeta al pulsar el avatar de la Navbar.
  toggleMenu(): void {
    this.isOpen.update(open => !open);
  }

  // Actualiza el rol y provoca el cambio inmediato de la información y acciones visibles.
  selectRole(event: Event): void {
    const role = (event.target as HTMLSelectElement).value as ProfileRole;
    this.selectedRole.set(role);
  }

  // Oculta la tarjeta de perfil.
  closeMenu(): void {
    this.isOpen.set(false);
  }

  // Restablece el estado temporal al perfil de invitado.
  signOut(): void {
    this.selectedRole.set('Invitado');
  }

  // Emite la acción de ver perfil y cierra el menú para una futura navegación.
  requestProfile(): void {
    this.profileRequested.emit();
    this.closeMenu();
  }

  // Emite la acción administrativa y cierra el menú para una futura navegación.
  requestAdministration(): void {
    this.administrationRequested.emit();
    this.closeMenu();
  }

  // Lleva al usuario invitado al formulario de inicio de sesión.
  goToLogin(): void {
    this.closeMenu();
    void this.router.navigate(['/auth/login']);
  }

  // Lleva al usuario invitado al formulario de registro.
  goToRegister(): void {
    this.closeMenu();
    void this.router.navigate(['/auth/register']);
  }

  @HostListener('document:click', ['$event'])
  // Cierra el menú cuando el clic ocurre fuera de su elemento raíz.
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.closeMenu();
    }
  }
}
