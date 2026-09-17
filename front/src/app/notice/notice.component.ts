import { Component, OnInit, computed, signal } from '@angular/core';
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


  // Crear / editar publicación (RF-09)
  isFormModalOpen = signal(false);
  isEditing = signal(false);
  editingUuid = signal<string | null>(null);
  formTitle = signal('');
  formContent = signal('');
  formMediaUrls = signal<string[]>(['']);
  formCategoryUuid = signal<string>('');
  saving = signal(false);
  formError = signal<string | null>(null);

  // Eliminar publicación (RF-09)
  confirmDeleteUuid = signal<string | null>(null);
  deleting = signal(false);
  deleteError = signal<string | null>(null);

  // Gestión de categorías (CRUD visual)
  isCategoryModalOpen = signal(false);
  editingCategoryUuid = signal<string | null>(null);
  categoryFormName = signal('');
  categoryFormColor = signal('#71717a');
  categorySaving = signal(false);
  categoryError = signal<string | null>(null);
  categoryDeleteUuid = signal<string | null>(null);
  categoryDeleting = signal(false);

  constructor(
    private noticeService: NoticeService,
    private commentService: CommentService,
    private reactionService: ReactionService,
    private categoryService: CategoryService,
    private authService: AuthService,
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

  canManagePublications = computed(() => {
    const role = this.authService.currentUser()?.role?.toLowerCase();
    return role === 'mod' || role === 'admin';
  });

  openModal(uuid: string) {
    this.selectedUuid.set(uuid);
    this.newCommentDraft.set('');
    this.confirmDeleteUuid.set(null);
    this.deleteError.set(null);
    this.reactionError.set(null);
    this.loadReactionSummary(uuid);
    this.loadComments(uuid);
  }

  closeModal() {
    this.selectedUuid.set(null);
    this.confirmDeleteUuid.set(null);
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

  // ===== Crear / editar publicación =====

  openCreateModal() {
    this.isEditing.set(false);
    this.editingUuid.set(null);
    this.formTitle.set('');
    this.formContent.set('');
    this.formMediaUrls.set(['']);
    this.formCategoryUuid.set('');
    this.formError.set(null);
    this.isFormModalOpen.set(true);
  }

  openEditModal(pub: Publication) {
    this.selectedUuid.set(null);
    this.isEditing.set(true);
    this.editingUuid.set(pub.uuid);
    this.formTitle.set(pub.title);
    this.formContent.set(pub.content);
    this.formMediaUrls.set(pub.media.length > 0 ? pub.media.map(m => m.url) : ['']);
    this.formCategoryUuid.set(pub.category?.uuid ?? '');
    this.formError.set(null);
    this.isFormModalOpen.set(true);
  }

  closeFormModal() {
    this.isFormModalOpen.set(false);
  }

  addMediaField() {
    this.formMediaUrls.update(list => [...list, '']);
  }

  removeMediaField(index: number) {
    this.formMediaUrls.update(list => list.filter((_, i) => i !== index));
  }

  updateMediaField(index: number, value: string) {
    this.formMediaUrls.update(list => list.map((url, i) => (i === index ? value : url)));
  }

  submitForm() {
    const title = this.formTitle().trim();
    const content = this.formContent().trim();

    if (!title || !content) {
      this.formError.set('El título y el contenido son obligatorios.');
      return;
    }

    const mediaUrls = this.formMediaUrls().map(url => url.trim()).filter(url => url.length > 0);
    const categoryUuid = this.formCategoryUuid() || undefined;

    this.saving.set(true);
    this.formError.set(null);

    if (this.isEditing() && this.editingUuid()) {
      const uuid = this.editingUuid()!;
      this.noticeService.update(uuid, { title, content, media: mediaUrls, categoryUuid }).subscribe({
        next: () => {
          const media = this.noticeService.buildMediaList(mediaUrls);
          const category = this.categories().find(c => c.uuid === categoryUuid) ?? null;
          this.news.update(list =>
            list.map(pub => (pub.uuid === uuid ? { ...pub, title, content, media, category } : pub))
          );
          this.saving.set(false);
          this.closeFormModal();
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.formError.set(err?.error?.message ?? 'No se pudo actualizar la publicación.');
        }
      });
      return;
    }

    this.noticeService.create({ title, content, media: mediaUrls, categoryUuid }).subscribe({
      next: (newPublication) => {
        this.news.update(list => [newPublication, ...list]);
        this.saving.set(false);
        this.closeFormModal();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.formError.set(err?.error?.message ?? 'No se pudo crear la publicación.');
      }
    });
  }

  // ===== Eliminar publicación =====

  requestDelete(uuid: string) {
    this.confirmDeleteUuid.set(uuid);
    this.deleteError.set(null);
  }

  cancelDelete() {
    this.confirmDeleteUuid.set(null);
  }

  confirmDelete() {
    const uuid = this.confirmDeleteUuid();
    if (!uuid) return;

    this.deleting.set(true);
    this.deleteError.set(null);

    this.noticeService.remove(uuid).subscribe({
      next: () => {
        this.news.update(list => list.filter(pub => pub.uuid !== uuid));
        this.deleting.set(false);
        this.confirmDeleteUuid.set(null);
        this.closeModal();
      },
      error: (err: HttpErrorResponse) => {
        this.deleting.set(false);
        this.deleteError.set(err?.error?.message ?? 'No se pudo eliminar la publicación.');
      }
    });
  }

  // ===== Gestión de categorías (CRUD visual) =====

  readonly emojiOptions: string[] = ['📢', '🌱', '⚙️', '📅', '👥', '💼', '🔬', '🏗️', '💧', '⚡'];
  categoryFormIcon = signal('📁');

  openCategoryModal() {
    this.editingCategoryUuid.set(null);
    this.categoryFormName.set('');
    this.categoryFormColor.set('#71717a');
    this.categoryFormIcon.set('📁');
    this.categoryError.set(null);
    this.categoryDeleteUuid.set(null);
    this.isCategoryModalOpen.set(true);
  }

  closeCategoryModal() {
    this.isCategoryModalOpen.set(false);
  }

  startEditCategory(cat: Category) {
    this.editingCategoryUuid.set(cat.uuid);
    this.categoryFormName.set(cat.name);
    this.categoryFormColor.set(cat.color);
    this.categoryFormIcon.set(cat.icon || '📁');
    this.categoryError.set(null);
  }

  cancelEditCategory() {
    this.editingCategoryUuid.set(null);
    this.categoryFormName.set('');
    this.categoryFormColor.set('#71717a');
    this.categoryFormIcon.set('📁');
    this.categoryError.set(null);
  }

  submitCategoryForm() {
    const name = this.categoryFormName().trim();
    if (!name) {
      this.categoryError.set('El nombre de la categoría es obligatorio.');
      return;
    }

    const color = this.categoryFormColor();
    const icon = this.categoryFormIcon();
    this.categorySaving.set(true);
    this.categoryError.set(null);

    const editingUuid = this.editingCategoryUuid();

    if (editingUuid) {
      this.categoryService.update(editingUuid, { name, color, icon }).subscribe({
        next: () => {
          this.categorySaving.set(false);
          this.cancelEditCategory();
          this.loadCategories();
        },
        error: (err: HttpErrorResponse) => {
          this.categorySaving.set(false);
          this.categoryError.set(err?.error?.message ?? 'No se pudo actualizar la categoría.');
        }
      });
      return;
    }

    this.categoryService.create({ name, color, icon }).subscribe({
      next: () => {
        this.categorySaving.set(false);
        this.categoryFormName.set('');
        this.categoryFormColor.set('#71717a');
        this.categoryFormIcon.set('📁');
        this.loadCategories();
      },
      error: (err: HttpErrorResponse) => {
        this.categorySaving.set(false);
        this.categoryError.set(err?.error?.message ?? 'No se pudo crear la categoría.');
      }
    });
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = '/logo.png';
    img.classList.add('fallback-logo');
    img.parentElement?.classList.add('no-media');
  }

  requestDeleteCategory(uuid: string) {
    this.categoryDeleteUuid.set(uuid);
    this.categoryError.set(null);
  }

  cancelDeleteCategory() {
    this.categoryDeleteUuid.set(null);
  }

  confirmDeleteCategory() {
    const uuid = this.categoryDeleteUuid();
    if (!uuid) return;

    this.categoryDeleting.set(true);
    this.categoryService.remove(uuid).subscribe({
      next: () => {
        this.categoryDeleting.set(false);
        this.categoryDeleteUuid.set(null);
        this.loadCategories();
      },
      error: (err: HttpErrorResponse) => {
        this.categoryDeleting.set(false);
        this.categoryError.set(err?.error?.message ?? 'No se pudo eliminar la categoría.');
      }
    });
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