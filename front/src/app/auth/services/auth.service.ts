import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RoleEnum } from '../../core/enum/role.enum';

export interface AuthUser {
  id: number;
  uuid?: string;
  username: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    user: AuthUser;
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

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data: AuthUser;
}

export interface ActionResponse {
  success: boolean;
  message: string;
}

export type UserSession = AuthUser;

// # Este bloque tiene como objetivo gestionar el estado global de autenticación, almacenamiento de tokens JWT e información del usuario
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  readonly currentUser = signal<AuthUser | null>(this.readUser());
  readonly isLoggedIn = computed(() => this.currentUser() !== null && this.getToken() !== null);
  readonly isAdmin = computed(() => {
    const role = this.currentUser()?.role?.toLowerCase()?.trim();
    return role === 'admin' || role === 'administrador';
  });
  readonly isMod = computed(() => {
    const role = this.currentUser()?.role?.toLowerCase()?.trim();
    return role === 'mod' || role === 'moderador';
  });

  constructor() {
    this.refreshProfile();
  }

  // # Este bloque tiene como objetivo sincronizar el perfil con el backend si ya existe una sesión activa
  refreshProfile(): void {
    if (this.isLoggedIn()) {
      this.getProfile().subscribe({
        next: (profile) => {
          this.updateCurrentUser({
            username: profile.username,
            avatar: profile.avatar || '',
            email: profile.email,
            role: profile.role,
            uuid: profile.uuid,
          });
        },
        error: () => {},
      });
    }
  }

  // # Este bloque tiene como objetivo actualizar propiedades del usuario autenticado en la sesión activa en tiempo real
  updateCurrentUser(partial: Partial<AuthUser>): void {
    const user = this.currentUser();
    if (user) {
      const updatedUser = { ...user, ...partial };
      if (sessionStorage.getItem('authUser')) {
        sessionStorage.setItem('authUser', JSON.stringify(updatedUser));
      }
      if (localStorage.getItem('authUser')) {
        localStorage.setItem('authUser', JSON.stringify(updatedUser));
      }
      this.currentUser.set(updatedUser);
    }
  }

  // # Este bloque tiene como objetivo actualizar el rol del usuario autenticado en la sesión activa
  updateCurrentUserRole(newRole: string): void {
    this.updateCurrentUser({ role: newRole });
  }

  // # Este bloque tiene como objetivo obtener los datos más recientes del perfil desde el backend
  getProfile(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.apiUrl}/profile`);
  }

  // # Este bloque tiene como objetivo actualizar el nombre y la foto del usuario autenticado
  updateProfile(payload: { name?: string; avatar?: string }): Observable<UpdateProfileResponse> {
    return this.http.patch<UpdateProfileResponse>(`${this.apiUrl}/profile`, payload).pipe(
      tap(response => {
        if (response.data) {
          this.updateCurrentUser({
            username: response.data.username,
            avatar: response.data.avatar || '',
          });
        }
      }),
    );
  }

  // # Este bloque tiene como objetivo verificar si la contraseña actual introducida por el usuario es correcta
  verifyPassword(password: string): Observable<ActionResponse> {
    return this.http.post<ActionResponse>(`${this.apiUrl}/verify-password`, { password });
  }

  // # Este bloque tiene como objetivo cambiar la contraseña del usuario autenticado
  changePassword(payload: { newPassword: string; currentPassword: string }): Observable<ActionResponse> {
    return this.http.patch<ActionResponse>(`${this.apiUrl}/change-password`, payload);
  }

  // # Este bloque tiene como objetivo eliminar definitivamente la cuenta del usuario autenticado
  deleteAccount(): Observable<ActionResponse> {
    return this.http.delete<ActionResponse>(`${this.apiUrl}/account`).pipe(
      tap(() => {
        this.logout();
      }),
    );
  }

  // # Este bloque tiene como objetivo realizar la petición HTTP de inicio de sesión y almacenar las credenciales
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

  // # Este bloque tiene como objetivo destruir los tokens de sesión y limpiar el estado de autenticación (logout)
  logout(): void {
    this.clearStorage();
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }

  // # Este bloque tiene como objetivo obtener el token JWT de acceso guardado
  getToken(): string | null {
    return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
  }

  // # Este bloque tiene como objetivo retornar de forma segura los datos del usuario logueado evitando valores undefined
  getUser(): AuthUser | null {
    const user = this.currentUser();
    if (!user || !this.getToken()) return null;

    return {
      id: user.id,
      uuid: user.uuid,
      username: user.username || (user as any).name || 'Usuario',
      email: user.email || '',
      role: user.role || 'user',
      avatar: user.avatar || '',
    };
  }

  // # Este bloque tiene como objetivo determinar si el usuario posee rol administrativo (admin o mod)
  hasManagementRole(): boolean {
    return this.isAdmin() || this.isMod();
  }

  // # Este bloque tiene como objetivo determinar si el usuario actual posee alguno de los roles indicados
  hasRole(roles: string | string[] | RoleEnum | RoleEnum[]): boolean {
    if (!this.isLoggedIn()) return false;
    const userRole = this.currentUser()?.role?.toLowerCase()?.trim();
    if (!userRole) return false;

    const normalizedUserRole = userRole === 'administrador' ? 'admin' : (userRole === 'moderador' ? 'mod' : userRole);
    const roleList = Array.isArray(roles) ? roles : [roles];

    return roleList.some((r) => {
      const normalizedTarget = r.toString().toLowerCase().trim();
      const target = normalizedTarget === 'administrador' ? 'admin' : (normalizedTarget === 'moderador' ? 'mod' : normalizedTarget);
      return target === normalizedUserRole;
    });
  }

  // # Este bloque tiene como objetivo evaluar si el usuario tiene autorización para ejecutar una acción sobre un sujeto según la matriz de permisos
  can(action: string, subject: string): boolean {
    if (!this.isLoggedIn()) return false;

    // Administrador cuenta con autorización total (all: true) según la convención de permisos
    if (this.isAdmin()) return true;

    const userRole = this.currentUser()?.role?.toLowerCase()?.trim();
    const normalizedRole = userRole === 'moderador' ? 'mod' : (userRole === 'administrador' ? 'admin' : (userRole || 'user'));

    const normalizedAction = action.toLowerCase().trim();
    const normalizedSubject = subject.toLowerCase().trim();

    // Matriz de permisos orientada a módulos según TEC.md
    const permissionMap: Record<string, Record<string, string[]>> = {
      mod: {
        admin: ['view'],
        publication: ['view', 'create', 'edit', 'delete'],
        event: ['view', 'create', 'edit'],
        comment: ['view', 'create', 'delete'],
        survey: ['view', 'participate'],
      },
      user: {
        admin: [],
        publication: ['view', 'create'],
        event: ['view'],
        comment: ['view', 'create'],
        survey: ['view', 'participate'],
      },
    };

    const rolePermissions = permissionMap[normalizedRole];
    if (!rolePermissions) return false;

    const allowedActions = rolePermissions[normalizedSubject];
    if (!allowedActions) return false;

    return allowedActions.includes(normalizedAction);
  }

  // # Este bloque tiene como objetivo guardar la sesión en localStorage o sessionStorage
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

  // # Este bloque tiene como objetivo limpiar tokens y sesión de ambos almacenamientos
  private clearStorage(): void {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('authUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authUser');
    try {
      localStorage.removeItem('libero_events_subscribed_active_user');
      localStorage.removeItem('libero_events_subscribed_backup');
    } catch {}
  }

  // # Este bloque tiene como objetivo leer y parsear la información guardada del usuario
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
