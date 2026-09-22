import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { NavbarComponent } from '../common/navbar/navbar.component';
import { FooterComponent } from '../common/footer/footer.component';
import { Category, Comment, Publication, ReactionType } from './publication.model';
import { NoticeService } from './services/notice.service';
import { CommentService } from './services/comment.service';
import { ReactionService } from './services/reaction.service';
import { CategoryService } from './services/category.service';
import { AuthService } from '../auth/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SafeUrlPipe } from './safe-url.pipe';

@Component({
  selector: 'app-notice',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent, SafeUrlPipe],
  templateUrl: './notice.component.html',
  styleUrl: './notice.component.scss'
})
export class NoticeComponent implements OnInit {
  selectedUuid = signal<string | null>(null);
  newCommentDraft = signal<string>('');
  news = signal<Publication[]>([]);
  loading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  commentsLoading = signal(false);
  reactionError = signal<string | null>(null);
  categories = signal<Category[]>([]);
  selectedCategoryUuid = signal<string | null>(null);

  selectedCategoryName = computed(() =>
    this.categories().find(c => c.uuid === this.selectedCategoryUuid())?.name ?? ''
  );

  featured = computed(() => (this.selectedCategoryUuid() ? null : this.news()[0] ?? null));
  recentThree = computed(() => (this.selectedCategoryUuid() ? [] : this.news().slice(1, 4)));
  sidebarLatest = computed(() => (this.selectedCategoryUuid() ? [] : this.news().slice(0, 5)));

  public readonly authService = inject(AuthService);
  readonly currentUser = this.authService.currentUser;
  readonly isLoggedIn = this.authService.isLoggedIn;

  constructor(
    private noticeService: NoticeService,
    private commentService: CommentService,
    private reactionService: ReactionService,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const categoria = params.get('categoria');
      this.selectedCategoryUuid.set(categoria);
      this.loadNews(categoria ?? undefined);
    });

    this.loadCategories();
  }

  private loadNews(categoryUuid?: string) {
    this.loading.set(true);
    this.noticeService.findAll(1, 50, categoryUuid).subscribe({
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

  private loadCategories() {
    this.categoryService.findAll().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => {
        // Si falla, simplemente no habrá opciones de categoría en los formularios.
      }
    });
  }

  selectedForModal = computed(() =>
    this.news().find(n => n.uuid === this.selectedUuid()) ?? null
  );

  openModal(uuid: string) {
    this.selectedUuid.set(uuid);
    this.newCommentDraft.set('');
    this.reactionError.set(null);
    this.loadReactionSummary(uuid);
    this.loadComments(uuid);
  }

  closeModal() {
    this.selectedUuid.set(null);
  }

  private loadReactionSummary(publicationUuid: string) {
    this.reactionService.getPublicationSummary(publicationUuid).subscribe({
      next: (summary) => {
        this.news.update(list =>
          list.map(pub =>
            pub.uuid === publicationUuid
              ? { ...pub, likes: summary.likes, dislikes: summary.dislikes, userReaction: summary.userReaction }
              : pub
          )
        );
      },
      error: () => {
        // Si falla, se queda con el conteo que ya tenía. No es crítico.
      }
    });
  }

  private loadComments(publicationUuid: string) {
    this.commentsLoading.set(true);
    this.commentService.findByPublication(publicationUuid).subscribe({
      next: (comments) => {
        if (comments.length === 0) {
          this.news.update(list =>
            list.map(pub => (pub.uuid === publicationUuid ? { ...pub, comments } : pub))
          );
          this.commentsLoading.set(false);
          return;
        }

        const summaryRequests = comments.map(c => this.reactionService.getCommentSummary(c.uuid));

        forkJoin(summaryRequests).subscribe({
          next: (summaries) => {
            const enriched = comments.map((c, i) => ({
              ...c,
              likes: summaries[i].likes,
              dislikes: summaries[i].dislikes,
              userReaction: summaries[i].userReaction
            }));
            this.news.update(list =>
              list.map(pub => (pub.uuid === publicationUuid ? { ...pub, comments: enriched } : pub))
            );
            this.commentsLoading.set(false);
          },
          error: () => {
            this.news.update(list =>
              list.map(pub => (pub.uuid === publicationUuid ? { ...pub, comments } : pub))
            );
            this.commentsLoading.set(false);
          }
        });
      },
      error: () => {
        this.commentsLoading.set(false);
      }
    });
  }

  toggleReaction(publicationUuid: string, type: ReactionType) {
    this.reactionError.set(null);
    this.reactionService.toggle({ publicationUuid }, type).subscribe({
      next: (result) => {
        this.news.update(list =>
          list.map(pub =>
            pub.uuid === publicationUuid ? this.applyReactionResult(pub, type, result.action) : pub
          )
        );
      },
      error: (err: HttpErrorResponse) => {
        this.reactionError.set(
          err.status === 401 ? 'Debes iniciar sesión para reaccionar.' : 'No se pudo procesar tu reacción.'
        );
      }
    });
  }

  toggleCommentReaction(publicationUuid: string, commentUuid: string, type: ReactionType) {
    this.reactionError.set(null);
    this.reactionService.toggle({ commentUuid }, type).subscribe({
      next: (result) => {
        this.news.update(list =>
          list.map(pub => {
            if (pub.uuid !== publicationUuid) return pub;
            return {
              ...pub,
              comments: pub.comments.map(c =>
                c.uuid === commentUuid ? this.applyReactionResult(c, type, result.action) : c
              )
            };
          })
        );
      },
      error: (err: HttpErrorResponse) => {
        this.reactionError.set(
          err.status === 401 ? 'Debes iniciar sesión para reaccionar.' : 'No se pudo procesar tu reacción.'
        );
      }
    });
  }

  sortOption = signal<'recent' | 'comments' | 'likes'>('recent');

  sortedNews = computed(() => {
    const list = [...this.news()];
    const opt = this.sortOption();

    if (opt === 'comments') return list.sort((a, b) => b.comments.length - a.comments.length);
    if (opt === 'likes') return list.sort((a, b) => b.likes - a.likes);
    return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  });

  featuredInCategory = computed(() => this.sortedNews()[0] ?? null);
  restInCategory = computed(() => this.sortedNews().slice(1));

  topRead = computed(() =>
    [...this.news()]
      .sort((a, b) => (b.likes + b.comments.length) - (a.likes + a.comments.length))
      .slice(0, 5)
  );

  setSortOption(value: string) {
    this.sortOption.set(value as 'recent' | 'comments' | 'likes');
  }

  viewAll = signal(false);

  showListView = computed(() => !!this.selectedCategoryUuid() || this.viewAll());

  showAllNews() {
    this.viewAll.set(true);
  }

  goToCategory(categoryUuid: string) {
    this.sortOption.set('recent');
    this.router.navigate([], { relativeTo: this.route, queryParams: { categoria: categoryUuid } });
  }

  clearCategoryFilter() {
    this.sortOption.set('recent');
    this.viewAll.set(false);
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  addComment(publicationUuid: string) {
    if (!this.isLoggedIn()) {
      this.reactionError.set('Debes iniciar sesión para comentar.');
      return;
    }

    const text = this.newCommentDraft().trim();
    if (!text) return;

    this.commentService.create(publicationUuid, text).subscribe({
      next: (comment: Comment) => {
        this.news.update(list =>
          list.map(pub =>
            pub.uuid === publicationUuid ? { ...pub, comments: [comment, ...pub.comments] } : pub
          )
        );
        this.newCommentDraft.set('');
        this.reactionError.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.reactionError.set(
          err.status === 401
            ? 'Debes iniciar sesión para comentar.'
            : err?.error?.message ?? 'No se pudo publicar tu comentario.'
        );
      }
    });
  }



  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = '/logo.png';
    img.classList.add('fallback-logo');
    img.parentElement?.classList.add('no-media');
  }



  private applyReactionResult<T extends { likes: number; dislikes: number; userReaction: ReactionType | null }>(
    entity: T,
    type: ReactionType,
    action: 'created' | 'updated' | 'removed'
  ): T {
    if (action === 'created') {
      return {
        ...entity,
        userReaction: type,
        likes: type === 'like' ? entity.likes + 1 : entity.likes,
        dislikes: type === 'dislike' ? entity.dislikes + 1 : entity.dislikes
      };
    }

    if (action === 'removed') {
      return {
        ...entity,
        userReaction: null,
        likes: type === 'like' ? entity.likes - 1 : entity.likes,
        dislikes: type === 'dislike' ? entity.dislikes - 1 : entity.dislikes
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