import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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

  navLinks = [
    { label: 'Inicio', fragment: 'inicio' },
    { label: 'Quiénes Somos', fragment: 'quienes-somos' },
    { label: 'Proyecto Mocoa', fragment: 'proyecto' },
    { label: 'Huellitas Verdes', fragment: 'huellitas-verdes' },
    { label: 'Contacto', fragment: 'contacto' },
  ];

  toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  scrollToSection(fragment: string): void {
    this.closeMenu();
    const el = document.getElementById(fragment);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.scrolled.set(window.scrollY > 50);
  }
}
