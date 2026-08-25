import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  facebookUrl = 'https://www.facebook.com/LiberoCobreCol';

  quickLinks = [
    { label: 'Inicio', fragment: 'inicio' },
    { label: 'Quiénes Somos', fragment: 'quienes-somos' },
    { label: 'Proyecto Mocoa', fragment: 'proyecto' },
    { label: 'Huellitas Verdes', fragment: 'huellitas-verdes' },
  ];

  scrollToSection(fragment: string): void {
    const el = document.getElementById(fragment);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
