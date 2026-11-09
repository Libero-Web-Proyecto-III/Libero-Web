import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { LoginComponent } from '../../app/auth/login/login.component';
import { AuthService, AuthResponse } from '../../app/auth/services/auth.service';

describe('[INTEGRACIÓN FRONTEND] LoginComponent – Flujo de Autenticación', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let router: Router;

  // Mock del AuthService para simular respuestas de API
  const mockAuthService = {
    login: vi.fn(),
    currentUser: vi.fn(),
    isLoggedIn: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('1. debería inicializar el formulario con campos vacíos y estado inválido', () => {
    expect(component.LoginForm).toBeDefined();
    expect(component.LoginForm.valid).toBe(false);

    const emailInput = fixture.debugElement.query(By.css('#user-email')).nativeElement as HTMLInputElement;
    const passwordInput = fixture.debugElement.query(By.css('#user-password')).nativeElement as HTMLInputElement;

    expect(emailInput.value).toBe('');
    expect(passwordInput.value).toBe('');
    expect(component.IsLoading).toBe(false);
  });

  it('2. debería validar formato de email y longitud mínima de contraseña en el DOM al ser tocados', () => {
    const emailControl = component.LoginForm.get('UserEmail');
    const passwordControl = component.LoginForm.get('UserPassword');

    // Email inválido y contraseña corta
    emailControl?.setValue('correo-invalido');
    emailControl?.markAsTouched();
    passwordControl?.setValue('123');
    passwordControl?.markAsTouched();

    fixture.detectChanges();

    const errorElements = fixture.debugElement.queryAll(By.css('.field-error span'));
    const errorTexts = errorElements.map((el) => (el.nativeElement.textContent as string).trim());

    expect(errorTexts).toContain('Por favor ingresa un correo electrónico válido.');
    expect(errorTexts).toContain('La contraseña debe tener al menos 6 caracteres.');
    expect(component.LoginForm.invalid).toBe(true);
  });

  it('3. debería alternar la visibilidad de la contraseña en el DOM al presionar el botón toggle', () => {
    const passwordInput = fixture.debugElement.query(By.css('#user-password')).nativeElement as HTMLInputElement;
    const toggleButton = fixture.debugElement.query(By.css('.toggle-password'));

    // Estado inicial: password
    expect(component.ShowPassword).toBe(false);
    expect(passwordInput.type).toBe('password');

    // Clic para mostrar
    toggleButton.triggerEventHandler('click', null);
    fixture.detectChanges();

    expect(component.ShowPassword).toBe(true);
    expect(passwordInput.type).toBe('text');

    // Clic para ocultar nuevamente
    toggleButton.triggerEventHandler('click', null);
    fixture.detectChanges();

    expect(component.ShowPassword).toBe(false);
    expect(passwordInput.type).toBe('password');
  });

  it('4. debería controlar la apertura y cierre del modal de Términos y Condiciones', () => {
    expect(component.IsTermsModalOpen).toBe(false);

    // Abrir modal de términos
    component.OpenTermsModal('terms');
    fixture.detectChanges();

    expect(component.IsTermsModalOpen).toBe(true);
    expect(component.TermsModalTab).toBe('terms');

    const modalElement = fixture.debugElement.query(By.css('app-terms-modal'));
    expect(modalElement).not.toBeNull();

    // Cerrar modal
    component.CloseTermsModal();
    fixture.detectChanges();

    expect(component.IsTermsModalOpen).toBe(false);
  });

  it('5. debería completar el flujo de login exitoso, mostrar alerta de éxito en el DOM y redirigir', () => {
    vi.useFakeTimers();

    const mockResponse: AuthResponse = {
      success: true,
      message: '¡Inicio de sesión exitoso! Redirigiendo...',
      data: {
        accessToken: 'mock-jwt-token-xyz',
        user: {
          id: 1,
          username: 'usuarioTest',
          email: 'usuario@test.com',
          role: 'user',
        },
      },
    };

    mockAuthService.login.mockReturnValue(of(mockResponse));

    // Llenar formulario con datos válidos
    component.LoginForm.get('UserEmail')?.setValue('usuario@test.com');
    component.LoginForm.get('UserPassword')?.setValue('passwordSegura123');
    component.LoginForm.get('RememberMe')?.setValue(true);

    fixture.detectChanges();

    // Enviar formulario
    component.OnSubmit();
    fixture.detectChanges();

    // Validar invocación del servicio con los parámetros correctos
    expect(mockAuthService.login).toHaveBeenCalledWith({
      identifier: 'usuario@test.com',
      password: 'passwordSegura123',
      rememberMe: true,
    });

    // Validar visualización de mensaje de éxito en el DOM
    const successAlert = fixture.debugElement.query(By.css('.alert-success'));
    expect(successAlert).not.toBeNull();
    expect(successAlert.nativeElement.textContent).toContain('¡Inicio de sesión exitoso! Redirigiendo...');

    // Avanzar temporizador de redirección
    vi.advanceTimersByTime(1500);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('6. debería manejar error 401 (contraseña incorrecta) y renderizar alerta de peligro en el DOM', () => {
    const error401 = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      error: { message: 'Contraseña incorrecta' },
    });

    mockAuthService.login.mockReturnValue(throwError(() => error401));

    component.LoginForm.get('UserEmail')?.setValue('usuario@test.com');
    component.LoginForm.get('UserPassword')?.setValue('passwordEquivocada');

    component.OnSubmit();
    fixture.detectChanges();

    expect(component.IsLoading).toBe(false);
    expect(component.ErrorMessage).toBe('Contraseña incorrecta');

    const dangerAlert = fixture.debugElement.query(By.css('.alert-danger'));
    expect(dangerAlert).not.toBeNull();
    expect(dangerAlert.nativeElement.textContent).toContain('Contraseña incorrecta');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('7. debería manejar error 404 (cuenta no encontrada) y renderizar alerta de error en el DOM', () => {
    const error404 = new HttpErrorResponse({
      status: 404,
      statusText: 'Not Found',
      error: { message: 'Cuenta no encontrada' },
    });

    mockAuthService.login.mockReturnValue(throwError(() => error404));

    component.LoginForm.get('UserEmail')?.setValue('noexiste@test.com');
    component.LoginForm.get('UserPassword')?.setValue('password1234');

    component.OnSubmit();
    fixture.detectChanges();

    expect(component.ErrorMessage).toBe('Cuenta no encontrada o no registrada');

    const dangerAlert = fixture.debugElement.query(By.css('.alert-danger'));
    expect(dangerAlert).not.toBeNull();
    expect(dangerAlert.nativeElement.textContent).toContain('Cuenta no encontrada o no registrada');
  });
});
