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
  author: { index: number; uuid: string; name: string; avatar?: string } | null;
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

    return this.http
      .post<RawComment>(this.apiUrl, { publicationUuid, content }, { headers: this.authHeaders() })
      .pipe(map(item => this.mapComment(item, currentUsername, currentAvatar)));
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  private mapComment(item: RawComment, fallbackAuthor?: string, fallbackAvatar?: string): Comment {
    return {
      uuid: item.uuid,
      author: item.author?.name || fallbackAuthor || 'Usuario',
      avatar: item.author?.avatar || fallbackAvatar || '',
      content: item.content,
      createdAt: new Date(item.createdAt),
      likes: 0,
      dislikes: 0,
      userReaction: null
    };
  }
}