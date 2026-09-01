import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface NavLink {
  label: string;
  path: string;
  exact: boolean;
  fragment?: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  menuOpen = signal(false);
  scrolled = signal(false);

  navLinks: NavLink[] = [
    { label: 'Inicio', path: '/', exact: true },
    { label: 'Eventos', path: '/eventos', exact: false },
    { label: 'Noticias', path: '/noticias', exact: false },
    { label: 'Quiénes Somos', path: '/about', exact: false },
  ];

  toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.scrolled.set(window.scrollY > 50);
  }
}
