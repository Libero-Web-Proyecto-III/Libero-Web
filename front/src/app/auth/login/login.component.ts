import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

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
    private RouterService: Router
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

    // Simulación de la operación de autenticación con el servidor
    setTimeout(() => {
      this.IsLoading = false;
      this.SuccessMessage = '¡Inicio de sesión exitoso! Redirigiendo...';
      console.log('Payload de inicio de sesión:', this.LoginForm.value);
    }, 1200);
  }
}