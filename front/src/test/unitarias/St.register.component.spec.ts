import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { RegisterComponent } from '../../app/auth/register/register.component';
import { AuthService } from '../../app/auth/services/auth.service';

/**
 * PRUEBA UNITARIA 2 — RegisterComponent
 * Revisa las validaciones del formulario de registro y qué muestra la pantalla
 * cuando el registro sale bien o sale mal. El servicio de autenticación se simula.
 */
describe('Prueba unitaria 2: RegisterComponent (formulario de registro)', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let authMock: { register: ReturnType<typeof vi.fn> };
  let router: Router;

  const datosValidos = {
    FullName: '  Stiven Ortega  ',
    UserEmail: 'Stiven@Libero.COM',
    UserPassword: 'Clave12345',
    ConfirmPassword: 'Clave12345',
    AcceptTerm: true,
  };

  const textoPantalla = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  beforeEach(async () => {
    authMock = { register: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('1) el formulario empieza vacío e inválido', () => {
    expect(component.RegisterForm.invalid).toBe(true);
    expect(component.RegisterForm.get('AcceptTerm')?.value).toBe(false);
  });

  it('2) marca error si el nombre es muy corto, el correo no es válido o la contraseña es corta', () => {
    component.RegisterForm.patchValue({
      FullName: 'St',
      UserEmail: 'correo-sin-arroba',
      UserPassword: '123',
    });

    expect(component.RegisterForm.get('FullName')?.hasError('minlength')).toBe(true);
    expect(component.RegisterForm.get('UserEmail')?.hasError('email')).toBe(true);
    expect(component.RegisterForm.get('UserPassword')?.hasError('minlength')).toBe(true);
  });

  it('3) marca error si las dos contraseñas no coinciden', () => {
    component.RegisterForm.patchValue({ ...datosValidos, ConfirmPassword: 'OtraClave999' });

    expect(component.RegisterForm.hasError('passwordMismatch')).toBe(true);
    expect(component.RegisterForm.get('ConfirmPassword')?.hasError('passwordMismatch')).toBe(true);
  });

  it('4) no deja enviar si no se aceptan los términos', () => {
    component.RegisterForm.patchValue({ ...datosValidos, AcceptTerm: false });

    component.OnSubmit();

    expect(authMock.register).not.toHaveBeenCalled();
    expect(component.RegisterForm.get('AcceptTerm')?.touched).toBe(true);
  });

  it('5) con datos correctos envía el registro limpio, muestra el mensaje de éxito y lleva al login', () => {
    vi.useFakeTimers();
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    authMock.register.mockReturnValue(of({ success: true, message: 'Usuario registrado correctamente.' }));

    component.RegisterForm.setValue(datosValidos);
    component.OnSubmit();
    fixture.detectChanges();

    expect(authMock.register).toHaveBeenCalledWith({
      username: 'Stiven Ortega',
      email: 'stiven@libero.com',
      password: 'Clave12345',
    });
    expect(component.IsLoading).toBe(false);
    expect(textoPantalla()).toContain('Usuario registrado correctamente.');

    vi.advanceTimersByTime(1500);
    expect(navegar).toHaveBeenCalledWith(['/auth/login']);
  });

  it('6) si el correo ya existe muestra el aviso del servidor en pantalla', () => {
    authMock.register.mockReturnValue(
      throwError(() => ({ status: 409, error: { message: 'El correo ya está registrado.' } })),
    );

    component.RegisterForm.setValue(datosValidos);
    component.OnSubmit();
    fixture.detectChanges();

    expect(component.ErrorMessage).toBe('El correo ya está registrado.');
    expect(textoPantalla()).toContain('El correo ya está registrado.');
    expect(component.IsLoading).toBe(false);
  });
});
