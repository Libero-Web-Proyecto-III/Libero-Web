import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { AuthService, AuthResponse, AuthUser } from '../../app/auth/services/auth.service';
import { environment } from '../../environments/environment';

/**
 * PRUEBA UNITARIA 1 — AuthService
 * Revisa el manejo de la sesión (guardar, recordar y cerrar) y los permisos por rol.
 * No se conecta al backend: las respuestas del servidor se simulan.
 */
describe('Prueba unitaria 1: AuthService (sesión y permisos)', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let router: Router;

  const loginUrl = `${environment.apiUrl}/auth/login`;

  const respuestaLogin = (role: string): AuthResponse => ({
    success: true,
    message: 'Inicio de sesión exitoso.',
    data: {
      accessToken: 'token-de-prueba',
      user: { id: 1, username: 'stiven', email: 'stiven@libero.com', role } as AuthUser,
    },
  });

  // Inicia sesión simulando la respuesta del servidor
  const iniciarSesion = (role: string, rememberMe = false) => {
    service.login({ identifier: 'stiven@libero.com', password: 'Clave12345', rememberMe }).subscribe();
    const req = http.expectOne(loginUrl);
    req.flush(respuestaLogin(role));
    return req;
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('1) arranca sin sesión cuando no hay nada guardado', () => {
    expect(service.isLoggedIn()).toBe(false);
    expect(service.getToken()).toBeNull();
    expect(service.getUser()).toBeNull();
  });

  it('2) al iniciar sesión envía los datos correctos y guarda la sesión solo mientras la pestaña esté abierta', () => {
    const req = iniciarSesion('user');

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ identifier: 'stiven@libero.com', password: 'Clave12345' });

    expect(sessionStorage.getItem('accessToken')).toBe('token-de-prueba');
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(service.isLoggedIn()).toBe(true);
    expect(service.getUser()?.username).toBe('stiven');
  });

  it('3) con "recordarme" guarda la sesión de forma permanente', () => {
    iniciarSesion('user', true);

    expect(localStorage.getItem('accessToken')).toBe('token-de-prueba');
    expect(sessionStorage.getItem('accessToken')).toBeNull();
    expect(service.isLoggedIn()).toBe(true);
  });

  it('4) al cerrar sesión borra todo y regresa al inicio', () => {
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    iniciarSesion('user', true);

    service.logout();

    expect(service.isLoggedIn()).toBe(false);
    expect(service.getToken()).toBeNull();
    expect(localStorage.getItem('authUser')).toBeNull();
    expect(navegar).toHaveBeenCalledWith(['/']);
  });

  it('5) un usuario normal solo puede ver y comentar, no administrar', () => {
    iniciarSesion('user');

    expect(service.hasRole('user')).toBe(true);
    expect(service.hasRole(['admin', 'mod'])).toBe(false);
    expect(service.can('view', 'publication')).toBe(true);
    expect(service.can('create', 'comment')).toBe(true);
    expect(service.can('delete', 'publication')).toBe(false);
    expect(service.can('view', 'admin')).toBe(false);
  });

  it('6) el moderador gestiona publicaciones y el administrador puede todo', () => {
    iniciarSesion('moderador');
    expect(service.isMod()).toBe(true);
    expect(service.hasRole('mod')).toBe(true);
    expect(service.can('delete', 'publication')).toBe(true);
    expect(service.can('view', 'admin')).toBe(false);

    iniciarSesion('admin');
    expect(service.isAdmin()).toBe(true);
    expect(service.hasManagementRole()).toBe(true);
    expect(service.can('view', 'admin')).toBe(true);
    expect(service.can('cualquier-accion', 'cualquier-modulo')).toBe(true);
  });
});
