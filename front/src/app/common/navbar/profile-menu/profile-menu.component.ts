import { Component, ElementRef, HostListener, computed, inject, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-profile-menu',
  standalone: true,
  templateUrl: './profile-menu.component.html',
  styleUrl: './profile-menu.component.scss',
})
export class ProfileMenuComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);
  public readonly authService = inject(AuthService);

  readonly profileRequested = output<void>();
  readonly administrationRequested = output<void>();

  readonly isOpen = signal(false);

  // Datos reactivos del usuario autenticado o Invitado
  readonly currentUser = this.authService.currentUser;
  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly isAdmin = this.authService.isAdmin;

  readonly initials = computed(() => {
    const user = this.currentUser();
    if (!user || !user.username) return '?';
    return user.username.charAt(0).toUpperCase();
  });

  readonly roleDisplayName = computed(() => {
    const user = this.currentUser();
    if (!user) return 'Invitado';
    return user.role?.toLowerCase() === 'admin' ? 'Administrador' : 'Usuario';
  });

  toggleMenu(): void {
    this.isOpen.update(open => !open);
  }

  closeMenu(): void {
    this.isOpen.set(false);
  }

  signOut(): void {
    this.authService.logout();
    this.closeMenu();
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
