import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    user: { id: number; username: string; email: string; role: string };
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

export type AuthUser = AuthResponse['data']['user'];
export type UserSession = AuthUser;

// # Este bloque tiene como objetivo gestionar el estado global de autenticación, almacenamiento de tokens JWT e información del usuario
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = 'http://localhost:3000/auth';

  readonly currentUser = signal<AuthUser | null>(this.readUser());
  readonly isLoggedIn = computed(() => this.currentUser() !== null && this.getToken() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  // # Este bloque tiene como objetivo actualizar el rol del usuario autenticado en la sesión activa (sessionStorage o localStorage) en tiempo real
  updateCurrentUserRole(newRole: string): void {
    const user = this.currentUser();
    if (user) {
      const updatedUser = { ...user, role: newRole };
      if (sessionStorage.getItem('authUser')) {
        sessionStorage.setItem('authUser', JSON.stringify(updatedUser));
      }
      if (localStorage.getItem('authUser')) {
        localStorage.setItem('authUser', JSON.stringify(updatedUser));
      }
      this.currentUser.set(updatedUser);
    }
  }

  // # Este bloque tiene como objetivo realizar la petición HTTP de inicio de sesión y almacenar las credenciales según la preferencia de mantener sesión
  login(payload: { identifier: string; password: string; rememberMe?: boolean }): Observable<AuthResponse> {
    const { identifier, password, rememberMe = false } = payload;
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { identifier, password }).pipe(
      tap(response => {
        this.saveSession(response.data.accessToken, response.data.user, rememberMe);
      }),
    );
  }

  // # Este bloque tiene como objetivo registrar un nuevo usuario en la plataforma
  register(payload: { username: string; email: string; password: string }): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, payload);
  }

  requestPasswordReset(email: string): Observable<PasswordResetResponse> {
    return this.http.post<PasswordResetResponse>(`${this.apiUrl}/request-password-reset`, { email });
  }

  resetPassword(token: string, password: string): Observable<PasswordResetResponse> {
    return this.http.post<PasswordResetResponse>(`${this.apiUrl}/reset-password`, { token, password });
  }

  // # Este bloque tiene como objetivo guardar la sesión en localStorage si rememberMe es true o en sessionStorage si es false
  private saveSession(token: string, user: AuthUser, rememberMe: boolean): void {
    this.clearStorage();

    if (rememberMe) {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('authUser', JSON.stringify(user));
    } else {
      sessionStorage.setItem('accessToken', token);
      sessionStorage.setItem('authUser', JSON.stringify(user));
    }

    this.currentUser.set(user);
  }

  // # Este bloque tiene como objetivo limpiar tokens y sesión de ambos almacenamientos (sessionStorage y localStorage)
  private clearStorage(): void {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('authUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authUser');
  }

<<<<<<< HEAD
  // # Este bloque tiene como objetivo guardar la sesión en localStorage si rememberMe es true o en sessionStorage si es false
  private saveSession(token: string, user: AuthUser, rememberMe: boolean): void {
    this.clearStorage();

    if (rememberMe) {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('authUser', JSON.stringify(user));
    } else {
      sessionStorage.setItem('accessToken', token);
      sessionStorage.setItem('authUser', JSON.stringify(user));
    }

    this.currentUser.set(user);
  }

  // # Este bloque tiene como objetivo limpiar tokens y sesión de ambos almacenamientos (sessionStorage y localStorage)
  private clearStorage(): void {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('authUser');
=======
  requestPasswordReset(email: string): Observable<PasswordResetResponse> {
    return this.http.post<PasswordResetResponse>(`${this.apiUrl}/request-password-reset`, { email });
  }

  resetPassword(token: string, password: string): Observable<PasswordResetResponse> {
    return this.http.post<PasswordResetResponse>(`${this.apiUrl}/reset-password`, { token, password });
  }

  // # Este bloque tiene como objetivo destruir los tokens de sesión y limpiar el estado de autenticación (logout), redirigiendo al inicio
  logout(): void {
>>>>>>> 7002f8294192e1289500cc744f7915c250e23b6f
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authUser');
  }

  // # Este bloque tiene como objetivo destruir los tokens de sesión y limpiar el estado de autenticación (logout), redirigiendo al inicio
  logout(): void {
    this.clearStorage();
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }

  // # Este bloque tiene como objetivo obtener el token JWT de acceso guardado (en sessionStorage o localStorage)
  getToken(): string | null {
    return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
  }

  // # Este bloque tiene como objetivo retornar de forma segura los datos del usuario logueado evitando valores undefined
  getUser(): { id: number; username: string; email: string; role: string } | null {
    const user = this.currentUser();
    if (!user || !this.getToken()) return null;

    return {
      id: user.id,
      username: user.username || (user as any).name || 'Usuario',
      email: user.email || '',
      role: user.role || 'user',
    };
  }

  // # Este bloque tiene como objetivo determinar si el usuario posee rol administrativo (admin o mod)
  hasManagementRole(): boolean {
    const role = this.getUser()?.role;
    return role === 'mod' || role === 'admin';
  }

  // # Este bloque tiene como objetivo leer y parsear la información guardada del usuario en sessionStorage o localStorage
  private readUser(): AuthUser | null {
    const value = sessionStorage.getItem('authUser') || localStorage.getItem('authUser');
    if (!value) return null;
    try {
      return JSON.parse(value) as AuthUser;
    } catch {
      return null;
    }
  }
}
