import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';
import { Publication, PublicationMedia } from './publication.model';

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

// Forma cruda que devuelve el backend, antes de mapearla al modelo del frontend.
interface RawPublication {
  index: number;
  uuid: string;
  title: string;
  content: string;
  media: string[];
  author: { index: number; uuid: string; name: string };
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class NoticeService {
  private readonly apiUrl = 'http://localhost:3000/publications';

  constructor(private http: HttpClient, private authService: AuthService) {}

  findAll(page = 1, limit = 10): Observable<{ data: Publication[]; meta: PaginationMeta }> {
    const params = new HttpParams().set('page', page).set('limit', limit);

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

  // Se deja lista para cuando lleguemos al commit de crear/editar noticias protegidas.
  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  private mapPublication(item: RawPublication): Publication {
    return {
      uuid: item.uuid,
      title: item.title,
      content: item.content,
      media: (item.media ?? []).map(url => this.mapMedia(url)),
      author: item.author?.name ?? 'Redacción',
      createdAt: new Date(item.createdAt),
      likes: 0,
      dislikes: 0,
      userReaction: null,
      comments: []
    };
  }

  // Infiere el tipo de archivo por su extensión, mientras el backend
  // no guarde ese dato explícitamente en cada elemento de `media`.
  private mapMedia(url: string): PublicationMedia {
    const isVideo = /\.(mp4|webm|ogg)$/i.test(url);
    return { url, type: isVideo ? 'video' : 'image' };
  }
}