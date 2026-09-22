import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  // Propiedades públicas del formulario y estado de la interfaz
  public LoginForm: FormGroup;
  public IsLoading: boolean = false;
  public ShowPassword: boolean = false;
  public ErrorMessage: string | null = null;
  public SuccessMessage: string | null = null;

  // Constructor: Inyección de servicios e inicialización de validaciones
  constructor(
    private FormBuilderService: FormBuilder,
    private RouterService: Router,
    private AuthService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    // Configuración del grupo de controles y reglas de validación del Login
    this.LoginForm = this.FormBuilderService.group({
      UserEmail: ['', [Validators.required, Validators.email]],
      UserPassword: ['', [Validators.required, Validators.minLength(6)]],
      RememberMe: [false],
    });
  }

  // Alternar la visibilidad del campo de contraseña (Mostrar/Ocultar)
  public TogglePasswordVisibility(): void {
    this.ShowPassword = !this.ShowPassword;
  }

  // Procesamiento y envío del formulario de inicio de sesión
  public OnSubmit(): void {
    // Validación previa de campos antes de procesar
    if (this.LoginForm.invalid) {
      this.LoginForm.markAllAsTouched();
      return;
    }

    // Activación del estado de carga y restablecimiento de mensajes
    this.IsLoading = true;
    this.ErrorMessage = null;
    this.SuccessMessage = null;
    this.cdr.detectChanges();

    const identifier = (this.LoginForm.value.UserEmail || '').trim();
    const password = this.LoginForm.value.UserPassword;
    const rememberMe = !!this.LoginForm.value.RememberMe;

    this.AuthService.login({
      identifier,
      password,
      rememberMe,
    })
      .pipe(
        finalize(() => {
          this.IsLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: response => {
          this.SuccessMessage = response.message || '¡Inicio de sesión exitoso! Redirigiendo...';
          this.cdr.detectChanges();
          setTimeout(() => {
            this.RouterService.navigate(['/']);
          }, 1500);
        },
        error: (err) => {
          if (err?.status === 404) {
            this.ErrorMessage = 'Cuenta no encontrada o no registrada';
          } else if (err?.status === 401) {
            this.ErrorMessage = 'Contraseña incorrecta';
          } else if (err?.error?.message) {
            this.ErrorMessage = Array.isArray(err.error.message)
              ? err.error.message[0]
              : err.error.message;
          } else {
            this.ErrorMessage = 'No se pudo iniciar sesión. Por favor verifica tus credenciales o conexión.';
          }
          this.cdr.detectChanges();
        },
      });
  }
}