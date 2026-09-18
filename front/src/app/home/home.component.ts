import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../common/navbar/navbar.component';
import { FooterComponent } from '../common/footer/footer.component';
import { SurveyViewerComponent } from '../survey/components/survey-viewer/survey-viewer.component';
import { SurveyService } from '../survey/services/survey.service';
import { Survey, SurveyStatusEnum } from '../survey/models/survey.model';

interface CarouselSlide {
  title: string;
  subtitle: string;
  imageUrl: string;
  bgClass: string;
}

interface HuellitasVideo {
  url: SafeResourceUrl;
  orientation: 'horizontal' | 'vertical';
}

interface HuellitasCard {
  title: string;
  subtitle: string;
  videoUrl: SafeResourceUrl;
  link: string;
}

export interface FacebookPost {
  id: string;
  message: string;
  full_picture?: string;
  created_time: string;
  permalink_url: string;
}

const huellitasCardSources = [
  {
    title: 'Feria de Arte 2026 - Huellitas Verdes',
    subtitle: 'Jornada al aire libre de Libero Cobre con talleres de arte en plastilina y dibujo, exposición de trabajos, picnic y juegos recreativos en inflable gigante para los niños de Huellitas Verdes.',
    url: 'https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2Freel%2F1426778744966032%2F&show_text=false&width=560&t=0',
    orientation: 'horizontal',
    link: 'https://www.facebook.com/reel/1426778744966032/',
  },
  {
    title: 'Huellitas Verdes - Cuentos y STEM',
    subtitle: 'Los niños escribieron e ilustraron cuentos, y en una clase de ciencia construyeron y pintaron lámparas con circuitos eléctricos para aprender sobre electricidad.',
    url: 'https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fwww.facebook.com%2Freel%2F2032017184202759%2F&show_text=false&width=267&t=0',
    orientation: 'vertical',
    link: 'https://www.facebook.com/reel/2032017184202759/',
  },
  {
    title: 'Reporteros por un Día - Huellitas Verdes',
    subtitle: 'Los niños de Huellitas Verdes aprendieron a identificar y verificar noticias de redes, TV, radio y prensa para fomentar pensamiento crítico.',
    url: 'https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fwww.facebook.com%2Freel%2F1360422689005939%2F&show_text=false&width=267&t=0',
    orientation: 'vertical',
    link: 'https://www.facebook.com/reel/1360422689005939/',
  },
  {
    title: 'Huellitas Verdes en la Granja',
    subtitle: 'Visita a una granja donde los niños aprendieron labores del campo, agricultura y equilibrio del ecosistema para fortalecer la conciencia ambiental y el cuidado de la naturaleza.',
    url: 'https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2Freel%2F1342744714175371%2F&show_text=false&width=560&t=0',
    orientation: 'horizontal',
    link: 'https://www.facebook.com/reel/1342744714175371/',
  },
  {
    title: 'Huellitas Verdes Aprende Compostaje',
    subtitle: 'Visita educativa donde los niños aprendieron a hacer compostaje y entender la sostenibilidad ambiental a través del aprendizaje práctico en campo.',
    url: 'https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2Freel%2F1559321785827982%2F&show_text=false&width=560&t=0',
    orientation: 'horizontal',
    link: 'https://www.facebook.com/reel/1559321785827982/',
  },
  {
    title: 'Huellitas Verdes Cuida el Aire',
    subtitle: 'Jornada educativa donde los niños aprendieron la importancia del aire y cómo cuidarlo con acciones simples como sembrar árboles, no quemar basuras, proteger bosques y promover el mantenimiento responsable de motos y carros.',
    url: 'https://www.facebook.com/plugins/video.php?height=312&href=https%3A%2F%2Fwww.facebook.com%2Freel%2F1058978710430502%2F&show_text=false&width=560&t=0',
    orientation: 'horizontal',
    link: 'https://www.facebook.com/reel/1058978710430502/',
  },
] as const;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent, SurveyViewerComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  // ─── Carrusel ──────────────────────────────────────────────────────────────
  currentSlide = signal(0);
  private carouselInterval: ReturnType<typeof setInterval> | null = null;

  slides: CarouselSlide[] = [
    {
      title: 'Diálogo y Liderazgo Regional',
      subtitle: 'Espacios de concertación para el desarrollo sostenible de Mocoa',
      imageUrl: '/sliders/Conferencia.jpg',
      bgClass: 'slide-1',
    },
    {
      title: 'Nuestro Talento Humano',
      subtitle: 'El equipo comprometido con el futuro del Putumayo',
      imageUrl: '/sliders/Equipo.jpg',
      bgClass: 'slide-2',
    },
    {
      title: 'Compromiso con la Comunidad',
      subtitle: 'Crecimiento, capacitación y progreso compartido',
      imageUrl: '/sliders/Screenshot 2026-09-17 at 10-59-38 (3) Facebook.png',
      bgClass: 'slide-3',
    },
    {
      title: 'Transición Energética Global',
      subtitle: 'Posicionando el cobre colombiano en la agenda internacional',
      imageUrl: '/sliders/slider.jpg',
      bgClass: 'slide-4',
    }
  ];

  // ─── Google Maps ──────────────────────────────────────────────────────────
  mapUrl: SafeResourceUrl;
  galleryVideoUrl: SafeResourceUrl;
  selectedGalleryImage = signal<string | null>(null);

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
  huellitasVideos: HuellitasVideo[] = [];
  huellitasCards: HuellitasCard[] = [];

  // ─── Encuestas Dinámicas (RF-17 / RF-18) ──────────────────────────────────
  private readonly surveyService = inject(SurveyService);
  // # Este bloque tiene como objetivo almacenar el estado de encuestas activas y el índice del carrusel en Home
  activeSurveys: Survey[] = [];
  selectedSurveyIdToAnswer: number | null = null;
  currentSurveyIndex: number = 0;

  constructor(
    private sanitizer: DomSanitizer,
    private http: HttpClient
  ) {
    // Mocoa, Putumayo - Coordenadas del área del proyecto
    const mapSrc =
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63872.13867!2d-76.6436!3d1.1490!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e2ef4b2e2d5c5d5%3A0x5ce5c5c5c5c5c5c5!2sMocoa%2C%20Putumayo!5e0!3m2!1ses!2sco!4v1700000000000!5m2!1ses!2sco';
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(mapSrc);

    const galleryVideoSrc =
      'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Freel%2F1156853673247801%2F&show_text=false&width=560&height=314';
    this.galleryVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(galleryVideoSrc);

    this.huellitasVideos = huellitasCardSources.map((video) => ({
      url: this.sanitizer.bypassSecurityTrustResourceUrl(video.url),
      orientation: video.orientation,
    }));

    this.huellitasCards = huellitasCardSources.map((card) => ({
      title: card.title,
      subtitle: card.subtitle,
      videoUrl: this.sanitizer.bypassSecurityTrustResourceUrl(card.url),
      link: card.link,
    }));
  }

  ngOnInit(): void {
    this.startCarousel();
    this.loadFacebookPosts();
    this.loadActiveSurveys();
  }

  // # Este bloque tiene como objetivo cargar las encuestas públicas disponibles para la comunidad en la página de inicio
  loadActiveSurveys(): void {
    this.surveyService.getSurveys(SurveyStatusEnum.PUBLISHED, true).subscribe({
      next: (surveys) => {
        this.activeSurveys = surveys || [];
        if (this.currentSurveyIndex >= this.activeSurveys.length) {
          this.currentSurveyIndex = 0;
        }
      },
      error: () => {
        this.activeSurveys = [];
      },
    });
  }

  // # Este bloque tiene como objetivo gestionar la navegación del carrusel de encuestas en la página principal
  nextSurvey(): void {
    if (this.activeSurveys.length > 0) {
      this.currentSurveyIndex = (this.currentSurveyIndex + 1) % this.activeSurveys.length;
    }
  }

  prevSurvey(): void {
    if (this.activeSurveys.length > 0) {
      this.currentSurveyIndex =
        (this.currentSurveyIndex - 1 + this.activeSurveys.length) % this.activeSurveys.length;
    }
  }

  goToSurvey(index: number): void {
    if (index >= 0 && index < this.activeSurveys.length) {
      this.currentSurveyIndex = index;
    }
  }

  // # Este bloque tiene como objetivo alternar la visualización del formulario interactivo para responder una encuesta activa
  toggleAnswerSurvey(id: number): void {
    if (this.selectedSurveyIdToAnswer === id) {
      this.selectedSurveyIdToAnswer = null;
    } else {
      this.selectedSurveyIdToAnswer = id;
    }
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

  openGalleryImage(imageUrl: string): void {
    this.selectedGalleryImage.set(imageUrl);
  }

  closeGalleryImage(): void {
    this.selectedGalleryImage.set(null);
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
