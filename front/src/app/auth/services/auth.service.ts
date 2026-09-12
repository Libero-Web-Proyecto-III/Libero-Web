import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    user: { id: number; username: string; email: string; role: string };
  };
}

interface RegisterResponse {
  success: boolean;
  message: string;
}

type AuthUser = AuthResponse['data']['user'];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/auth';
  readonly currentUser = signal<AuthUser | null>(this.readUser());
  readonly isLoggedIn = computed(() => this.currentUser() !== null && this.getToken() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  login(payload: { identifier: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, payload).pipe(
      tap(response => {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('authUser', JSON.stringify(response.data.user));
        this.currentUser.set(response.data.user);
      }),
    );
  }

  register(payload: { username: string; email: string; password: string }): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, payload);
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authUser');
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getUser(): { id: number; username: string; email: string; role: string } | null {
    return this.currentUser();
  }

  hasManagementRole(): boolean {
    const role = this.getUser()?.role;
    return role === 'mod' || role === 'admin';
  }

  private readUser(): AuthUser | null {
    const value = localStorage.getItem('authUser');
    return value ? JSON.parse(value) as AuthUser : null;
  }
}
