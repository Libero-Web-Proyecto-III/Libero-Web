import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { ReactionType } from '../publication.model';

interface ReactionSummaryRaw {
  likes: number;
  dislikes: number;
  userReaction: ReactionType | null;
}

interface ReactResultRaw {
  action: 'created' | 'updated' | 'removed';
  reaction: { type: ReactionType } | null;
}

@Injectable({ providedIn: 'root' })
export class ReactionService {
  private readonly apiUrl = 'http://localhost:3000/reactions';

  constructor(private http: HttpClient, private authService: AuthService) {}

  toggle(target: { publicationUuid?: string; commentUuid?: string }, type: ReactionType): Observable<ReactResultRaw> {
    return this.http.post<ReactResultRaw>(this.apiUrl, { ...target, type }, { headers: this.authHeaders() });
  }

  getPublicationSummary(publicationUuid: string): Observable<ReactionSummaryRaw> {
    const params = this.buildUserParams();
    return this.http.get<ReactionSummaryRaw>(`${this.apiUrl}/publication/${publicationUuid}`, { params });
  }

  getCommentSummary(commentUuid: string): Observable<ReactionSummaryRaw> {
    const params = this.buildUserParams();
    return this.http.get<ReactionSummaryRaw>(`${this.apiUrl}/comment/${commentUuid}`, { params });
  }

  private buildUserParams(): HttpParams | undefined {
    const userUuid = this.authService.currentUser()?.uuid;
    return userUuid ? new HttpParams().set('userUuid', userUuid) : undefined;
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }
}