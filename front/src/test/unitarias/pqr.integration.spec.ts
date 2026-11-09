import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { PqrComponent } from '../../app/pqr/pqr.component';
import { PqrService } from '../../app/pqr/services/pqr.service';
import { AuthService, AuthUser } from '../../app/auth/services/auth.service';
import { NavbarComponent } from '../../app/common/navbar/navbar.component';
import { FooterComponent } from '../../app/common/footer/footer.component';

// Stubs ligeros de Navbar y Footer para aislar la prueba en PqrComponent
@Component({ selector: 'app-navbar', standalone: true, template: '' })
class MockNavbarComponent {}

@Component({ selector: 'app-footer', standalone: true, template: '' })
class MockFooterComponent {}

describe('[INTEGRACIÓN FRONTEND] PqrComponent – Flujo de Solicitudes PQR', () => {
  let fixture: ComponentFixture<PqrComponent>;
  let component: PqrComponent;

  const mockUser: AuthUser = {
    id: 10,
    username: 'Juan Perez',
    email: 'juan@test.com',
    role: 'user',
  };

  const currentUserSignal = signal<AuthUser | null>(mockUser);
  const isLoggedInSignal = signal<boolean>(true);

  const mockAuthService = {
    currentUser: currentUserSignal,
    isLoggedIn: isLoggedInSignal,
  };

  const mockPqrService = {
    create: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    currentUserSignal.set(mockUser);
    isLoggedInSignal.set(true);

    await TestBed.configureTestingModule({
      imports: [PqrComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: PqrService, useValue: mockPqrService },
      ],
    })
      .overrideComponent(PqrComponent, {
        remove: { imports: [NavbarComponent, FooterComponent] },
        add: { imports: [MockNavbarComponent, MockFooterComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PqrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('1. debería mostrar el bloqueo de inicio de sesión cuando el usuario es visitante no autenticado', () => {
    isLoggedInSignal.set(false);
    currentUserSignal.set(null);
    fixture.detectChanges();

    const lockBox = fixture.debugElement.query(By.css('.login-required-box'));
    expect(lockBox).not.toBeNull();
    expect(lockBox.nativeElement.textContent).toContain('Inicia sesión para enviar una PQR');

    const form = fixture.debugElement.query(By.css('.pqr-form'));
    expect(form).toBeNull();
  });

  it('2. debería mostrar el formulario con los datos del usuario cuando ha iniciado sesión', () => {
    const senderCard = fixture.debugElement.query(By.css('.sender-info-card'));
    expect(senderCard).not.toBeNull();
    expect(senderCard.nativeElement.textContent).toContain('Enviando como Juan Perez');
    expect(senderCard.nativeElement.textContent).toContain('juan@test.com');
  });

  it('3. debería alternar al modo de envío anónimo cambiando la identidad en el DOM', () => {
    component.isAnonymous.set(true);
    fixture.detectChanges();

    const anonTitle = fixture.debugElement.query(By.css('.identity-title'));
    expect(anonTitle.nativeElement.textContent).toContain('Envío Anónimo');

    const anonSubtitle = fixture.debugElement.query(By.css('.identity-subtitle'));
    expect(anonSubtitle.nativeElement.textContent).toContain('Tu nombre y correo no serán visibles');
  });

  it('4. debería validar longitudes mínimas de asunto (mín 5) y mensaje (mín 10) mostrando error en el DOM', () => {
    // Caso: asunto muy corto
    component.formSubject.set('Hola');
    component.formMessage.set('Mensaje de prueba con más de diez caracteres.');
    component.submitPqr();
    fixture.detectChanges();

    expect(component.sendError()).toBe('El asunto debe tener al menos 5 caracteres.');
    let errorEl = fixture.debugElement.query(By.css('.pqr-error'));
    expect(errorEl.nativeElement.textContent).toContain('El asunto debe tener al menos 5 caracteres.');

    // Caso: mensaje muy corto
    component.formSubject.set('Asunto Válido');
    component.formMessage.set('Corto');
    component.submitPqr();
    fixture.detectChanges();

    expect(component.sendError()).toBe('El mensaje debe tener al menos 10 caracteres.');
    errorEl = fixture.debugElement.query(By.css('.pqr-error'));
    expect(errorEl.nativeElement.textContent).toContain('El mensaje debe tener al menos 10 caracteres.');
  });

  it('5. debería permitir seleccionar el tipo de solicitud (queja, reclamo, sugerencia)', () => {
    component.formType.set('reclamo');
    fixture.detectChanges();

    expect(component.formType()).toBe('reclamo');
  });

  it('6. debería completar el flujo de envío exitoso, llamar a PqrService, limpiar campos y mostrar confirmación en el DOM', () => {
    mockPqrService.create.mockReturnValue(of({ success: true, message: 'PQR creada' }));

    component.formType.set('queja');
    component.formPhone.set('3101234567');
    component.formSubject.set('Problema con el servicio de agua');
    component.formMessage.set('Llevamos 3 días sin suministro de agua en el sector.');
    component.isAnonymous.set(false);

    component.submitPqr();
    fixture.detectChanges();

    expect(mockPqrService.create).toHaveBeenCalledWith({
      phone: '3101234567',
      isAnonymous: false,
      type: 'queja',
      subject: 'Problema con el servicio de agua',
      message: 'Llevamos 3 días sin suministro de agua en el sector.',
    });

    expect(component.sendSuccess()).toBe(true);
    expect(component.formSubject()).toBe('');
    expect(component.formMessage()).toBe('');

    const successBox = fixture.debugElement.query(By.css('.success-box'));
    expect(successBox).not.toBeNull();
    expect(successBox.nativeElement.textContent).toContain('¡Gracias por tu mensaje!');

    // Probar botón para enviar otra PQR
    component.dismissSuccess();
    fixture.detectChanges();
    expect(component.sendSuccess()).toBe(false);
  });

  it('7. debería manejar fallo del backend al enviar la PQR y mostrar el error en el DOM', () => {
    mockPqrService.create.mockReturnValue(
      throwError(() => ({ error: { message: 'No se pudo procesar la solicitud en el servidor' } }))
    );

    component.formSubject.set('Falla eléctrica');
    component.formMessage.set('Corte imprevisto de energía en el bloque principal.');

    component.submitPqr();
    fixture.detectChanges();

    expect(component.sending()).toBe(false);
    expect(component.sendError()).toBe('No se pudo procesar la solicitud en el servidor');

    const errorEl = fixture.debugElement.query(By.css('.pqr-error'));
    expect(errorEl).not.toBeNull();
    expect(errorEl.nativeElement.textContent).toContain('No se pudo procesar la solicitud en el servidor');
  });
});
