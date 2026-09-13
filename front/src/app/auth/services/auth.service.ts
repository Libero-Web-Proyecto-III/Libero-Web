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

interface RegisterResponse {
  success: boolean;
  message: string;
}

type AuthUser = AuthResponse['data']['user'];

// # Este bloque tiene como objetivo gestionar el estado global de autenticación, almacenamiento de tokens JWT e información del usuario
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = 'http://localhost:3000/auth';

  readonly currentUser = signal<AuthUser | null>(this.readUser());
  readonly isLoggedIn = computed(() => this.currentUser() !== null && this.getToken() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  // # Este bloque tiene como objetivo realizar la petición HTTP de inicio de sesión y guardar la sesión activa
  login(payload: { identifier: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, payload).pipe(
      tap(response => {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('authUser', JSON.stringify(response.data.user));
        this.currentUser.set(response.data.user);
      }),
    );
  }

  // # Este bloque tiene como objetivo registrar un nuevo usuario en la plataforma
  register(payload: { username: string; email: string; password: string }): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, payload);
  }

  // # Este bloque tiene como objetivo destruir los tokens de sesión y limpiar el estado de autenticación (logout), redirigiendo al inicio
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authUser');
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }

  // # Este bloque tiene como objetivo obtener el token JWT de acceso guardado localmente
  getToken(): string | null {
    return localStorage.getItem('accessToken');
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

  // # Este bloque tiene como objetivo leer y parsear la información guardada del usuario en localStorage
  private readUser(): AuthUser | null {
    const value = localStorage.getItem('authUser');
    if (!value) return null;
    try {
      return JSON.parse(value) as AuthUser;
    } catch {
      return null;
    }
  }
}
