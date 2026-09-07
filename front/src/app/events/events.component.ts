import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../home/navbar/navbar.component';
import { FooterComponent } from '../home/footer/footer.component';

export interface EventItem {
  id: number;
  title: string;
  subtitle: string;
  dateDay: string;
  dateMonth: string;
  time: string;
  location: string;
  city: string;
  description: string;
  imageUrl: string;
  isSubscribed?: boolean;
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './events.component.html',
  styleUrl: './events.component.scss'
})
export class EventsComponent {
  searchTerm = signal<string>('');
  selectedEventForModal = signal<EventItem | null>(null);
  subscriptionSuccess = signal<boolean>(false);

  events = signal<EventItem[]>([
    {
      id: 1,
      title: 'SINFONÍA NOCTURNA: GALA Y MÚSICA EN VIVO',
      subtitle: 'Una velada inmersiva con la Orquesta Filarmónica Contemporánea',
      dateDay: '28',
      dateMonth: 'AGO',
      time: '20:30 - 23:30 HRS',
      location: 'Gran Teatro Metropolitano',
      city: 'Sala Principal',
      description: 'Disfruta de una experiencia acústica y visual sin precedentes. Un concierto exclusivo donde la luz, el sonido y el diseño minimalista se fusionan en una atmósfera totalmente inmersiva.',
      imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1400&q=80',
      isSubscribed: false
    },
    {
      id: 2,
      title: 'SUMMIT INTERNACIONAL DE ARQUITECTURA & DISEÑO',
      subtitle: 'Conferencias magistrales sobre brutalismo, vanguardia y espacio urbano',
      dateDay: '05',
      dateMonth: 'SEP',
      time: '09:00 - 18:00 HRS',
      location: 'Centro de Convenciones Vanguard',
      city: 'Auditorio Alfa',
      description: 'Líderes mundiales del diseño se reúnen para debatir la evolución del espacio urbano, estructuras sostenibles y la estética del contraste en la era moderna.',
      imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80',
      isSubscribed: false
    },
    {
      id: 3,
      title: 'RETROSPECTIVA DE FOTOGRAFÍA EN BLANCO Y NEGRO',
      subtitle: 'Exposición de sombras, contrastes y la belleza del claroscuro',
      dateDay: '12',
      dateMonth: 'SEP',
      time: '11:00 - 20:00 HRS',
      location: 'Galería de Arte Monocromo',
      city: 'Salón Blanco',
      description: 'Más de 150 piezas icónicas capturadas por fotógrafos de renombre mundial. Una exploración profunda de la textura, el ángulo y el dramatismo de la luz sin distracción de color.',
      imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1400&q=80',
      isSubscribed: false
    },
    {
      id: 4,
      title: 'NOCHE DE JAZZ & BLUES EN LA PENUMBRA',
      subtitle: 'Sesión íntima en vivo con cuarteto internacional de saxo y piano',
      dateDay: '19',
      dateMonth: 'SEP',
      time: '21:00 - 02:00 HRS',
      location: 'Club Nocturno Lúmen',
      city: 'Zona Principal',
      description: 'Siente el ritmo envolvente del jazz clásico en un ambiente tenue e íntimo. Iluminación suave y sonido puro para los amantes de la buena música.',
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1400&q=80',
      isSubscribed: false
    },
    {
      id: 5,
      title: 'MUESTRA DE CINE INDEPENDIENTE EN 35MM',
      subtitle: 'Ciclo de largometrajes clásicos y obras maestras del cine de autor',
      dateDay: '25',
      dateMonth: 'SEP',
      time: '18:30 - 22:00 HRS',
      location: 'Cineforo Noir',
      city: 'Proyección 1',
      description: 'Una selección curada de filmes en celuloide original de 35mm. Incluye debate posterior con directores y críticos invitados sobre el arte cinematográfico.',
      imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1400&q=80',
      isSubscribed: false
    }
  ]);

  filteredEvents = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();

    return this.events().filter(event => {
      return term === '' ||
        event.title.toLowerCase().includes(term) ||
        event.subtitle.toLowerCase().includes(term) ||
        event.location.toLowerCase().includes(term) ||
        event.description.toLowerCase().includes(term);
    });
  });

  openModal(event: EventItem) {
    this.selectedEventForModal.set(event);
    this.subscriptionSuccess.set(false);
  }

  closeModal() {
    this.selectedEventForModal.set(null);
  }

  confirmSubscription() {
    const current = this.selectedEventForModal();
    if (!current) return;

    this.events.update(list =>
      list.map(item =>
        item.id === current.id ? { ...item, isSubscribed: true } : item
      )
    );

    // Keep the success state open until the user manually closes it
    this.subscriptionSuccess.set(true);
  }
}
