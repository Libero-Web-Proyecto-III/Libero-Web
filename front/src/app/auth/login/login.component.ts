import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  // Estado completo utilizado por el formulario de inicio de sesión y sus mensajes visuales.
  public LoginForm: FormGroup;
  public IsLoading: boolean = false;
  public ShowPassword: boolean = false;
  public ErrorMessage: string | null = null;
  public SuccessMessage: string | null = null;

  // Constructor: Inyección de servicios e inicialización de validaciones
  constructor(
    private FormBuilderService: FormBuilder,
    private RouterService: Router,
    private AuthService: AuthService
  ) {
    // Define los campos del login y las validaciones que deben cumplir antes del envío.
    this.LoginForm = this.FormBuilderService.group({
      UserEmail: ['', [Validators.required]],
      UserPassword: ['', [Validators.required]],
      RememberMe: [false],
    });
  }

  // Alternar la visibilidad del campo de contraseña (Mostrar/Ocultar)
  public TogglePasswordVisibility(): void {
    this.ShowPassword = !this.ShowPassword;
  }

  // Procesamiento y envío del formulario de inicio de sesión
  public OnSubmit(): void {
    if (this.LoginForm.invalid) {
      this.LoginForm.markAllAsTouched();
      return;
    }

    // Activación del estado de carga y restablecimiento de mensajes
    this.IsLoading = true;
    this.ErrorMessage = null;
    this.SuccessMessage = null;

    const payload = {
      identifier: this.LoginForm.value.UserEmail,
      password: this.LoginForm.value.UserPassword,
    };

    // Envío HTTP real al backend NestJS (POST http://localhost:3000/auth/login)
    this.AuthService.login(payload).subscribe({
      next: (response) => {
        this.IsLoading = false;
        this.SuccessMessage = response.message || '¡Inicio de sesión exitoso! Redirigiendo...';
        setTimeout(() => {
          this.RouterService.navigate(['/']);
        }, 1500);
      },
      error: (err: Error) => {
        this.IsLoading = false;
        this.ErrorMessage = err.message;
      },
    });
  }
}