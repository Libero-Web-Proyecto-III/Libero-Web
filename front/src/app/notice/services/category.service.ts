import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { Category } from '../publication.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
    private readonly apiUrl = 'http://localhost:3000/categories';

    constructor(private http: HttpClient, private authService: AuthService) { }

    findAll(): Observable<Category[]> {
        return this.http.get<Category[]>(this.apiUrl);
    }

    create(payload: { name: string; color?: string; icon?: string }): Observable<Category> {
        return this.http.post<Category>(this.apiUrl, payload, { headers: this.authHeaders() });
    }

    update(uuid: string, payload: { name?: string; color?: string; icon?: string }): Observable<Category> {
        return this.http.patch<Category>(`${this.apiUrl}/${uuid}`, payload, { headers: this.authHeaders() });
    }

    remove(uuid: string): Observable<unknown> {
        return this.http.delete(`${this.apiUrl}/${uuid}`, { headers: this.authHeaders() });
    }

    private authHeaders(): HttpHeaders {
        const token = this.authService.getToken();
        return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
    }
}