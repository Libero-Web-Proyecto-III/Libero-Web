import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface AuthResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface UserSession {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface LoginData {
  accessToken: string;
  user: UserSession;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000/auth';

  // Estado reactivo del usuario logueado en la sesión activa (null = Invitado)
  public readonly currentUser = signal<UserSession | null>(this.getInitialUser());
  public readonly isLoggedIn = computed(() => this.currentUser() !== null);
  public readonly isAdmin = computed(() => this.currentUser()?.role?.toLowerCase() === 'admin');

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el usuario guardado inicialmente en localStorage
   */
  private getInitialUser(): UserSession | null {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Envía la solicitud de registro al backend NestJS
   */
  public register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Envía las credenciales de inicio de sesión al backend NestJS
   */
  public login(credentials: LoginRequest): Observable<AuthResponse<LoginData>> {
    return this.http.post<AuthResponse<LoginData>>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        if (response.success && response.data?.accessToken) {
          this.saveSession(response.data.accessToken, response.data.user);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Guarda el token de acceso y los datos de usuario en localStorage y actualiza la señal
   */
  private saveSession(accessToken: string, user: UserSession): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUser.set(user);
  }

  /**
   * Cierra la sesión activa borrando el almacenamiento local y volviendo a estado Invitado
   */
  public logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');
    this.currentUser.set(null);
  }

  /**
   * Retorna el token almacenado
   */
  public getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Manejo centralizado de errores HTTP retornados por NestJS
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error inesperado al conectar con el servidor.';

    if (error.error) {
      if (typeof error.error.message === 'string') {
        errorMessage = error.error.message;
      } else if (Array.isArray(error.error.message)) {
        errorMessage = error.error.message.join('. ');
      } else if (error.error.error) {
        errorMessage = error.error.error;
      }
    } else if (error.status === 0) {
      errorMessage = 'No se pudo conectar con el servidor backend (NestJS en http://localhost:3000). Asegúrate de que esté en ejecución.';
    }

    return throwError(() => new Error(errorMessage));
  }
}
