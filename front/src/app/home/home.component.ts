import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';

interface CarouselSlide {
  title: string;
  subtitle: string;
  gradient: string;
  bgClass: string;
}

export interface FacebookPost {
  id: string;
  message: string;
  full_picture?: string;
  created_time: string;
  permalink_url: string;
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

  // ─── Facebook Posts ───────────────────────────────────────────────────────
  facebookPosts = signal<FacebookPost[]>([]);
  isLoadingFb = signal<boolean>(true);

  // ─── Estadísticas ──────────────────────────────────────────────────────────
  stats = [
    { value: '1.300', label: 'Mt de Recursos Minerales', icon: '⛏️' },
    { value: '0.49%', label: 'Ley Equivalente de Cobre', icon: '🔩' },
    { value: '30+', label: 'Años de Exploración', icon: '📅' },
    { value: '100%', label: 'Compromiso Ambiental', icon: '🌿' },
  ];

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

  constructor(
    private sanitizer: DomSanitizer,
    private http: HttpClient
  ) {
    // Mocoa, Putumayo - Coordenadas del área del proyecto
    const mapSrc =
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63872.13867!2d-76.6436!3d1.1490!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e2ef4b2e2d5c5d5%3A0x5ce5c5c5c5c5c5c5!2sMocoa%2C%20Putumayo!5e0!3m2!1ses!2sco!4v1700000000000!5m2!1ses!2sco';
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(mapSrc);
  }

  ngOnInit(): void {
    this.startCarousel();
    this.loadFacebookPosts();
  }

  ngOnDestroy(): void {
    this.stopCarousel();
  }

  scrollFbLeft(track: HTMLElement): void {
    track.scrollBy({ left: -420, behavior: 'smooth' });
  }

  scrollFbRight(track: HTMLElement): void {
    track.scrollBy({ left: 420, behavior: 'smooth' });
  }

  onImageError(post: FacebookPost): void {
    post.full_picture = undefined;
  }

  loadFacebookPosts(): void {
    this.isLoadingFb.set(true);
    // Intentar obtener los posts del backend NestJS
    this.http.get<FacebookPost[]>('http://localhost:3000/facebook/posts?limit=6').subscribe({
      next: (posts) => {
        if (posts && posts.length > 0) {
          // Decodificar &amp; en las URLs de imágenes (RSS las devuelve con entidades HTML)
          const cleaned = posts.map(p => ({
            ...p,
            full_picture: p.full_picture
              ? p.full_picture.replace(/&amp;/g, '&').replace(/&amp;amp;/g, '&')
              : undefined,
          }));
          this.facebookPosts.set(cleaned);
        } else {
          this.facebookPosts.set(this.getFallbackFacebookPosts());
        }
        this.isLoadingFb.set(false);
      },
      error: () => {
        // En caso de que el backend aún no esté corriendo, usar fallback decorativo directo
        this.facebookPosts.set(this.getFallbackFacebookPosts());
        this.isLoadingFb.set(false);
      },
    });
  }

  private getFallbackFacebookPosts(): FacebookPost[] {
    return [
      {
        id: 'fb-1',
        message: 'Avanzamos con responsabilidad social y ambiental en el Proyecto Mocoa, impulsando el desarrollo sostenible y la conservación de la biodiversidad en el departamento de Putumayo. #LiberoCobre #Mocoa',
        full_picture: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1000&auto=format&fit=crop',
        created_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        permalink_url: 'https://www.facebook.com/LiberoCobreCol',
      },
      {
        id: 'fb-2',
        message: 'A través de nuestra iniciativa "Huellitas Verdes", fortalecemos los programas de reforestación activa con especies nativas y monitoreo hídrico en las cuencas del municipio de Mocoa. 🌿💧',
        full_picture: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1000&auto=format&fit=crop',
        created_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        permalink_url: 'https://www.facebook.com/LiberoCobreCol',
      },
      {
        id: 'fb-3',
        message: 'El cobre es el metal esencial para la transición energética global. El depósito de Mocoa posiciona a Colombia como un actor clave en la infraestructura limpia y renovable del futuro. ⚡⛏️',
        full_picture: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?q=80&w=1000&auto=format&fit=crop',
        created_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        permalink_url: 'https://www.facebook.com/LiberoCobreCol',
      },
      {
        id: 'fb-4',
        message: 'Junto a las comunidades locales de Mocoa, promovemos talleres de educación ambiental y desarrollo comunitario para construir un futuro compartido en la Amazonia. 🤝🌳',
        full_picture: 'https://images.unsplash.com/photo-1511497584788-876761c119ef?q=80&w=1000&auto=format&fit=crop',
        created_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        permalink_url: 'https://www.facebook.com/LiberoCobreCol',
      },
      {
        id: 'fb-5',
        message: 'Implementamos estándares internacionales de exploración geológica limpia y transparente, protegiendo los suelos y recursos hídricos de la región. 💧🛡️',
        full_picture: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1000&auto=format&fit=crop',
        created_time: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        permalink_url: 'https://www.facebook.com/LiberoCobreCol',
      },
    ];
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
