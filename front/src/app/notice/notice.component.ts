import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../common/navbar/navbar.component';
import { FooterComponent } from '../common/footer/footer.component';
import { Comment, Publication, ReactionType } from './publication.model';
import { NoticeService } from './notice.service';

@Component({
  selector: 'app-notice',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './notice.component.html',
  styleUrl: './notice.component.scss'
})
export class NoticeComponent implements OnInit {
  selectedUuid = signal<string | null>(null);
  newCommentDraft = signal<string>('');
  news = signal<Publication[]>([]);
  loading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  constructor(private noticeService: NoticeService) {}

  ngOnInit(): void {
    this.noticeService.findAll().subscribe({
      next: (res) => {
        this.news.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudieron cargar las noticias. Verifica que el backend esté corriendo en localhost:3000.');
        this.loading.set(false);
      }
    });
  }

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