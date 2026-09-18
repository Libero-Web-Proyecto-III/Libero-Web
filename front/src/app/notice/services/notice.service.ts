import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { Category, Publication, PublicationMedia } from '../publication.model';

interface PaginationMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

interface RawReaction {
  type: 'like' | 'dislike';
}

interface RawCommentLite {
  uuid: string;
}

interface RawCategory {
  uuid: string;
  name: string;
  color: string;
}

interface RawPublication {
  index: number;
  uuid: string;
  title: string;
  content: string;
  media: string[];
  author: { index: number; uuid: string; name: string };
  category: RawCategory | null;
  createdAt: string;
  updatedAt: string;
  comments?: RawCommentLite[];
  reactions?: RawReaction[];
}

interface PublicationPayload {
  title: string;
  content: string;
  media: string[];
  categoryUuid?: string;
}

@Injectable({ providedIn: 'root' })
export class NoticeService {
  private readonly apiUrl = 'http://localhost:3000/publications';

  constructor(private http: HttpClient, private authService: AuthService) { }

  findAll(page = 1, limit = 10, categoryUuid?: string): Observable<{ data: Publication[]; meta: PaginationMeta }> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (categoryUuid) {
      params = params.set('categoryUuid', categoryUuid);
    }

    return this.http.get<PaginatedResponse<RawPublication>>(this.apiUrl, { params }).pipe(
      map(res => ({
        data: res.data.map(item => this.mapPublication(item)),
        meta: res.meta
      }))
    );
  }

  findOne(uuid: string): Observable<Publication> {
    return this.http.get<RawPublication>(`${this.apiUrl}/${uuid}`).pipe(
      map(item => this.mapPublication(item))
    );
  }

  create(payload: PublicationPayload): Observable<Publication> {
    return this.http
      .post<RawPublication>(this.apiUrl, payload, { headers: this.authHeaders() })
      .pipe(map(item => this.mapPublication(item)));
  }

  update(uuid: string, payload: PublicationPayload): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/${uuid}`, payload, { headers: this.authHeaders() });
  }

  remove(uuid: string): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/${uuid}`, { headers: this.authHeaders() });
  }

  buildMediaList(urls: string[]): PublicationMedia[] {
    return urls.map(url => this.mapMedia(url));
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  private mapPublication(item: RawPublication): Publication {
    const reactions = item.reactions ?? [];
    const commentsCount = item.comments?.length ?? 0;

    return {
      uuid: item.uuid,
      title: item.title,
      content: item.content,
      media: (item.media ?? []).map(url => this.mapMedia(url)),
      author: item.author?.name ?? 'Redacción',
      category: item.category ? { uuid: item.category.uuid, name: item.category.name, color: item.category.color } : null,
      createdAt: new Date(item.createdAt),
      likes: reactions.filter(r => r.type === 'like').length,
      dislikes: reactions.filter(r => r.type === 'dislike').length,
      userReaction: null,
      comments: Array.from({ length: commentsCount })
    } as Publication;
  }

  private mapMedia(url: string): PublicationMedia {
    const youtubeId = this.extractYoutubeId(url);
    if (youtubeId) {
      return {
        url,
        type: 'video',
        poster: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${youtubeId}`
      };
    }

    const isVideo = /\.(mp4|webm|ogg)$/i.test(url);
    return { url, type: isVideo ? 'video' : 'image' };
  }

  private extractYoutubeId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }
}