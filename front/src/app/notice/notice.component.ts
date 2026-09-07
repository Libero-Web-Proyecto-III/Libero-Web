import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../home/navbar/navbar.component';
import { FooterComponent } from '../home/footer/footer.component';
import { Comment, Publication, ReactionType } from './publication.model';

@Component({
  selector: 'app-notice',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './notice.component.html',
  styleUrl: './notice.component.scss'
})
export class NoticeComponent {
  selectedUuid = signal<string | null>(null);
  newCommentDraft = signal<string>('');

  news = signal<Publication[]>([
    {
      uuid: '1',
      title: 'Nuevo avance en energías renovables promete duplicar la eficiencia solar',
      content:
        'Un equipo de investigadores presentó un panel solar de doble capa que aprovecha longitudes de onda antes desperdiciadas. Según los primeros resultados, la eficiencia de conversión podría acercarse al 45% en condiciones controladas, un salto importante frente al estándar actual de la industria.',
      media: [{ url: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1400&q=80', type: 'image' }],
      author: 'Redacción Ciencia',
      createdAt: new Date('2026-09-01T10:00:00'),
      likes: 24,
      dislikes: 2,
      userReaction: null,
      comments: [
        {
          uuid: 'c1', author: 'Marcela R.', content: 'Ojalá esto llegue pronto a proyectos comunitarios.',
          createdAt: new Date('2026-09-01T12:00:00'), likes: 5, dislikes: 0, userReaction: null
        },
        {
          uuid: 'c2', author: 'Andrés T.', content: 'Falta ver el costo de producción real, pero suena prometedor.',
          createdAt: new Date('2026-09-01T13:30:00'), likes: 2, dislikes: 1, userReaction: null
        }
      ]
    },
    {
      uuid: '2',
      title: 'Descubren especie marina bioluminiscente en aguas profundas del Pacífico',
      content:
        'La expedición registró un organismo nunca antes catalogado a más de 3.000 metros de profundidad. Su capacidad de emitir luz propia podría ayudar a entender mejor los ecosistemas de zonas abisales, prácticamente inexploradas hasta hace pocos años.',
      media: [{ url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1400&q=80', type: 'image' }],
      author: 'Redacción Ciencia',
      createdAt: new Date('2026-08-29T09:15:00'),
      likes: 41,
      dislikes: 1,
      userReaction: null,
      comments: [
        {
          uuid: 'c3', author: 'Laura P.', content: 'El océano sigue guardando sorpresas increíbles.',
          createdAt: new Date('2026-08-29T10:00:00'), likes: 8, dislikes: 0, userReaction: null
        }
      ]
    },
    {
      uuid: '3',
      title: 'Ciudades inteligentes: la movilidad eléctrica avanza en Latinoamérica',
      content:
        'Varias capitales de la región están ampliando sus flotas de transporte público eléctrico. El reporte destaca reducciones medibles en ruido y emisiones locales, aunque advierte sobre los retos de infraestructura de carga a gran escala.',
      media: [{ url: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1400&q=80', type: 'image' }],
      author: 'Redacción Urbana',
      createdAt: new Date('2026-08-25T08:00:00'),
      likes: 17,
      dislikes: 3,
      userReaction: null,
      comments: []
    },
    {
      uuid: '4',
      title: 'Documental corto: el futuro del reciclaje de plástico',
      content:
        'Un recorrido audiovisual por plantas de reciclaje de nueva generación que separan y transforman plástico con procesos casi completamente automatizados, reduciendo tiempos y contaminación cruzada entre materiales.',
      media: [{
        url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        type: 'video',
        poster: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1400&q=80'
      }],
      author: 'Comunicaciones',
      createdAt: new Date('2026-08-20T14:00:00'),
      likes: 30,
      dislikes: 0,
      userReaction: null,
      comments: [
        {
          uuid: 'c4', author: 'Julián S.', content: 'Excelente edición, se entiende clarísimo el proceso.',
          createdAt: new Date('2026-08-20T15:00:00'), likes: 6, dislikes: 0, userReaction: null
        }
      ]
    },
    {
      uuid: '5',
      title: 'Avance médico: nueva terapia genética reduce riesgo cardiovascular',
      content:
        'Los resultados preliminares de un ensayo clínico muestran una disminución significativa de un marcador asociado a enfermedades del corazón. Los investigadores piden cautela: aún se necesitan estudios más amplios antes de hablar de un tratamiento definitivo.',
      media: [{ url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1400&q=80', type: 'image' }],
      author: 'Redacción Salud',
      createdAt: new Date('2026-08-15T11:00:00'),
      likes: 52,
      dislikes: 4,
      userReaction: null,
      comments: []
    },
    {
      uuid: '6',
      title: 'Reportaje: la robótica aplicada a la agricultura sostenible',
      content:
        'Pequeños robots autónomos ya están ayudando a identificar plagas y optimizar el riego en cultivos piloto. El reportaje muestra cómo esta tecnología busca reducir el uso de agroquímicos sin afectar el rendimiento de la cosecha.',
      media: [{
        url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/coffee.mp4',
        type: 'video',
        poster: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1400&q=80'
      }],
      author: 'Comunicaciones',
      createdAt: new Date('2026-08-10T09:00:00'),
      likes: 19,
      dislikes: 1,
      userReaction: null,
      comments: []
    }
  ]);

  selectedForModal = computed(() =>
    this.news().find(n => n.uuid === this.selectedUuid()) ?? null
  );

  openModal(uuid: string) {
    this.selectedUuid.set(uuid);
    this.newCommentDraft.set('');
  }

  closeModal() {
    this.selectedUuid.set(null);
  }

  toggleReaction(publicationUuid: string, type: ReactionType) {
    this.news.update(list =>
      list.map(pub => (pub.uuid === publicationUuid ? this.applyReaction(pub, type) : pub))
    );
  }

  toggleCommentReaction(publicationUuid: string, commentUuid: string, type: ReactionType) {
    this.news.update(list =>
      list.map(pub => {
        if (pub.uuid !== publicationUuid) return pub;
        return {
          ...pub,
          comments: pub.comments.map(c => (c.uuid === commentUuid ? this.applyReaction(c, type) : c))
        };
      })
    );
  }

  addComment(publicationUuid: string) {
    const text = this.newCommentDraft().trim();
    if (!text) return;

    const comment: Comment = {
      uuid: crypto.randomUUID(),
      author: 'Tú',
      content: text,
      createdAt: new Date(),
      likes: 0,
      dislikes: 0,
      userReaction: null
    };

    this.news.update(list =>
      list.map(pub =>
        pub.uuid === publicationUuid ? { ...pub, comments: [comment, ...pub.comments] } : pub
      )
    );

    this.newCommentDraft.set('');
  }

  // Misma lógica de toggle que usa el backend en ReactionService:
  // sin reacción -> se crea; mismo tipo -> se quita; tipo contrario -> se reemplaza.
  private applyReaction<T extends { likes: number; dislikes: number; userReaction: ReactionType | null }>(
    entity: T,
    type: ReactionType
  ): T {
    const current = entity.userReaction;

    if (current === type) {
      return {
        ...entity,
        userReaction: null,
        likes: type === 'like' ? entity.likes - 1 : entity.likes,
        dislikes: type === 'dislike' ? entity.dislikes - 1 : entity.dislikes
      };
    }

    if (current === null) {
      return {
        ...entity,
        userReaction: type,
        likes: type === 'like' ? entity.likes + 1 : entity.likes,
        dislikes: type === 'dislike' ? entity.dislikes + 1 : entity.dislikes
      };
    }

    return {
      ...entity,
      userReaction: type,
      likes: type === 'like' ? entity.likes + 1 : entity.likes - 1,
      dislikes: type === 'dislike' ? entity.dislikes + 1 : entity.dislikes - 1
    };
  }
}