import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';

interface CarouselSlide {
  title: string;
  subtitle: string;
  gradient: string;
  bgClass: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  // ─── Carrusel ──────────────────────────────────────────────────────────────
  currentSlide = signal(0);
  private carouselInterval: ReturnType<typeof setInterval> | null = null;

  slides: CarouselSlide[] = [
    {
      title: 'Proyecto Mocoa',
      subtitle: 'Descubriendo el potencial del cobre y molibdeno en el corazón de la Amazonia colombiana',
      gradient: 'linear-gradient(135deg, rgba(27,67,50,0.82) 0%, rgba(200,121,65,0.6) 100%)',
      bgClass: 'slide-1',
    },
    {
      title: 'Huellitas Verdes',
      subtitle: 'Nuestra iniciativa de responsabilidad ambiental que protege la biodiversidad única de Putumayo',
      gradient: 'linear-gradient(135deg, rgba(27,67,50,0.85) 0%, rgba(64,145,108,0.7) 100%)',
      bgClass: 'slide-2',
    },
    {
      title: 'Mocoa, Putumayo',
      subtitle: 'Comprometidos con el desarrollo sostenible y el bienestar de las comunidades amazónicas',
      gradient: 'linear-gradient(135deg, rgba(27,67,50,0.88) 0%, rgba(45,106,79,0.75) 100%)',
      bgClass: 'slide-3',
    },
    {
      title: 'Transición Energética',
      subtitle: 'El cobre de Mocoa contribuye a construir un futuro más limpio y renovable para Colombia',
      gradient: 'linear-gradient(135deg, rgba(200,121,65,0.75) 0%, rgba(27,67,50,0.9) 100%)',
      bgClass: 'slide-4',
    },
  ];

  // ─── Google Maps ──────────────────────────────────────────────────────────
  mapUrl: SafeResourceUrl;

  // ─── Huellitas Verdes ──────────────────────────────────────────────────────
  huellitasItems = [
    {
      title: 'Reforestación Activa',
      desc: 'Programas de siembra de especies nativas en zonas de influencia del proyecto, restaurando el ecosistema amazónico.',
    },
    {
      title: 'Protección de Fauna',
      desc: 'Monitoreo continuo de especies de flora y fauna en el área de concesión, garantizando su conservación.',
    },
    {
      title: 'Cuencas Hídricas',
      desc: 'Gestión responsable del agua en cuencas del río Mocoa, asegurando la calidad del recurso para comunidades locales.',
    },
    {
      title: 'Comunidades Locales',
      desc: 'Trabajo conjunto con comunidades indígenas y campesinas de Putumayo para un desarrollo con identidad cultural.',
    },
    {
      title: 'Monitoreo Ambiental',
      desc: 'Seguimiento permanente de indicadores ambientales con informes transparentes y accesibles para la ciudadanía.',
    },
    {
      title: 'Economía Circular',
      desc: 'Prácticas mineras que minimizan residuos y maximizan la eficiencia en el uso de recursos naturales.',
    },
  ];

  constructor(private sanitizer: DomSanitizer) {
    // Mocoa, Putumayo - Coordenadas del área del proyecto
    const mapSrc =
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63872.13867!2d-76.6436!3d1.1490!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e2ef4b2e2d5c5d5%3A0x5ce5c5c5c5c5c5c5!2sMocoa%2C%20Putumayo!5e0!3m2!1ses!2sco!4v1700000000000!5m2!1ses!2sco';
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(mapSrc);
  }

  ngOnInit(): void {
    this.startCarousel();
  }

  ngOnDestroy(): void {
    this.stopCarousel();
  }

  startCarousel(): void {
    this.carouselInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  stopCarousel(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
      this.carouselInterval = null;
    }
  }

  goToSlide(index: number): void {
    this.currentSlide.set(index);
    this.stopCarousel();
    this.startCarousel();
  }

  nextSlide(): void {
    this.currentSlide.update(i => (i + 1) % this.slides.length);
  }

  prevSlide(): void {
    this.currentSlide.update(i => (i - 1 + this.slides.length) % this.slides.length);
    this.stopCarousel();
    this.startCarousel();
  }
}
