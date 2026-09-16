import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';
import { Comment } from './publication.model';

interface RawComment {
  index: number;
  uuid: string;
  content: string;
  author: { index: number; uuid: string; name: string };
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
}

@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly apiUrl = 'http://localhost:3000/comments';

  constructor(private http: HttpClient, private authService: AuthService) {}

  findByPublication(publicationUuid: string): Observable<Comment[]> {
    const params = new HttpParams().set('publicationUuid', publicationUuid).set('limit', 50);
    return this.http.get<PaginatedResponse<RawComment>>(this.apiUrl, { params }).pipe(
      map(res => res.data.map(item => this.mapComment(item)))
    );
  }

  create(publicationUuid: string, content: string): Observable<Comment> {
    return this.http
      .post<RawComment>(this.apiUrl, { publicationUuid, content }, { headers: this.authHeaders() })
      .pipe(map(item => this.mapComment(item)));
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  private mapComment(item: RawComment): Comment {
    return {
      uuid: item.uuid,
      author: item.author?.name ?? 'Usuario',
      content: item.content,
      createdAt: new Date(item.createdAt),
      likes: 0,
      dislikes: 0,
      userReaction: null
    };
  }
}