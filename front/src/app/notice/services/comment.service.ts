import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { Comment } from '../publication.model';
import { environment } from '../../../environments/environment';

interface RawComment {
  index: number;
  uuid: string;
  content: string;
  author: {
    index: number;
    uuid: string;
    name: string;
    avatar?: string;
    rol?: { id?: number; name?: string } | string;
    tag?: { id?: number; name?: string; color?: string } | string;
    tags?: Array<{ id?: number; name?: string; color?: string }>;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
}

@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly apiUrl = `${environment.apiUrl}/comments`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  findByPublication(publicationUuid: string): Observable<Comment[]> {
    const params = new HttpParams().set('publicationUuid', publicationUuid).set('limit', 50);
    return this.http.get<PaginatedResponse<RawComment>>(this.apiUrl, { params }).pipe(
      map(res => res.data.map(item => this.mapComment(item)))
    );
  }

  create(publicationUuid: string, content: string): Observable<Comment> {
    const currentUser = this.authService.currentUser();
    const currentUsername = currentUser?.username;
    const currentAvatar = currentUser?.avatar;
    const currentRole = currentUser?.role;

    return this.http
      .post<RawComment>(this.apiUrl, { publicationUuid, content }, { headers: this.authHeaders() })
      .pipe(map(item => this.mapComment(item, currentUsername, currentAvatar, currentRole)));
  }

  delete(commentUuid: string, reason?: string): Observable<any> {
    const params = reason ? new HttpParams().set('reason', reason) : undefined;
    return this.http.request('delete', `${this.apiUrl}/${commentUuid}`, {
      headers: this.authHeaders(),
      body: { reason },
      params,
    });
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  private mapComment(
    item: RawComment,
    fallbackAuthor?: string,
    fallbackAvatar?: string,
    fallbackRole?: string,
  ): Comment {
    let roleStr = '';
    if (item.author?.rol) {
      roleStr = typeof item.author.rol === 'object' ? item.author.rol.name || '' : item.author.rol;
    } else if (fallbackRole) {
      roleStr = fallbackRole;
    }

    const allTags: { id?: number; name: string; color?: string }[] = [];

    if (item.author?.tags && Array.isArray(item.author.tags)) {
      for (const t of item.author.tags) {
        if (t && typeof t === 'object' && t.name) {
          allTags.push({ id: t.id, name: t.name.trim(), color: t.color?.trim() || '' });
        } else if (typeof t === 'string' && (t as string).trim()) {
          allTags.push({ name: (t as string).trim() });
        }
      }
    }

    if (item.author?.tag) {
      if (typeof item.author.tag === 'object' && item.author.tag.name) {
        const tagName = item.author.tag.name.trim();
        if (!allTags.some(t => t.name.toLowerCase() === tagName.toLowerCase())) {
          allTags.unshift({
            id: item.author.tag.id,
            name: tagName,
            color: item.author.tag.color?.trim() || '',
          });
        }
      } else if (typeof item.author.tag === 'string' && item.author.tag.trim()) {
        const tagName = item.author.tag.trim();
        if (!allTags.some(t => t.name.toLowerCase() === tagName.toLowerCase())) {
          allTags.unshift({ name: tagName });
        }
      }
    }

    const firstTag = allTags[0];
    const tagStr = firstTag?.name || '';
    const tagColor = firstTag?.color || '';

    return {
      uuid: item.uuid,
      author: item.author?.name || fallbackAuthor || 'Usuario',
      authorUuid: item.author?.uuid || '',
      authorRole: roleStr.toLowerCase().trim(),
      authorTag: tagStr.trim(),
      authorTagColor: tagColor.trim(),
      authorTags: allTags,
      avatar: item.author?.avatar || fallbackAvatar || '',
      content: item.content,
      createdAt: new Date(item.createdAt),
      likes: 0,
      dislikes: 0,
      userReaction: null
    };
  }
}