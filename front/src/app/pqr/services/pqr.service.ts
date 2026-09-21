import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { Pqr, PqrStatus, PqrType } from '../pqr.model';

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

interface RawPqr {
  uuid: string;
  fullName: string;
  email: string;
  phone: string | null;
  type: PqrType;
  subject: string;
  message: string;
  status: PqrStatus;
  response: string | null;
  respondedAt: string | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class PqrService {
  private readonly apiUrl = 'http://localhost:3000/pqrs';

  constructor(private http: HttpClient, private authService: AuthService) {}

  create(payload: { fullName: string; email: string; phone?: string; type: PqrType; subject: string; message: string }): Observable<Pqr> {
    return this.http.post<RawPqr>(this.apiUrl, payload).pipe(map(item => this.mapPqr(item)));
  }

  findAll(page = 1, limit = 20, type?: PqrType, status?: PqrStatus): Observable<{ data: Pqr[]; meta: PaginationMeta }> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (type) params = params.set('type', type);
    if (status) params = params.set('status', status);

    return this.http.get<PaginatedResponse<RawPqr>>(this.apiUrl, { params, headers: this.authHeaders() }).pipe(
      map(res => ({ data: res.data.map(item => this.mapPqr(item)), meta: res.meta }))
    );
  }

  updateStatus(uuid: string, status: PqrStatus, response?: string): Observable<Pqr> {
    return this.http
      .patch<RawPqr>(`${this.apiUrl}/${uuid}/status`, { status, response }, { headers: this.authHeaders() })
      .pipe(map(item => this.mapPqr(item)));
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  private mapPqr(item: RawPqr): Pqr {
    return {
      uuid: item.uuid,
      fullName: item.fullName,
      email: item.email,
      phone: item.phone,
      type: item.type,
      subject: item.subject,
      message: item.message,
      status: item.status,
      response: item.response,
      respondedAt: item.respondedAt ? new Date(item.respondedAt) : null,
      createdAt: new Date(item.createdAt)
    };
  }
}