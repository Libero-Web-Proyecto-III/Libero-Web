import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  // Propiedades públicas del formulario y estados de visibilidad e interfaz
  public RegisterForm: FormGroup;
  public IsLoading: boolean = false;
  public ShowPassword: boolean = false;
  public ShowConfirmPassword: boolean = false;
  public ErrorMessage: string | null = null;
  public SuccessMessage: string | null = null;

  // Constructor: Inyección de servicios e inicialización de validaciones de Registro
  constructor(
    private FormBuilderService: FormBuilder,
    private RouterService: Router
  ) {
    // Configuración de controles y regla de coincidencia de contraseñas
    this.RegisterForm = this.FormBuilderService.group(
      {
        FullName: ['', [Validators.required, Validators.minLength(3)]],
        UserEmail: ['', [Validators.required, Validators.email]],
        UserPassword: ['', [Validators.required, Validators.minLength(6)]],
        ConfirmPassword: ['', [Validators.required]],
        AcceptTerm: [false, [Validators.requiredTrue]],
      },
      { validators: this.PasswordMatchValidator }
    );
  }

  // Validador personalizado para comprobar la coincidencia de las contraseñas
  private PasswordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('UserPassword')?.value;
    const confirmPassword = control.get('ConfirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      control.get('ConfirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  // Alternar la visibilidad de la contraseña principal
  public TogglePasswordVisibility(): void {
    this.ShowPassword = !this.ShowPassword;
  }

  // Alternar la visibilidad de la confirmación de contraseña
  public ToggleConfirmPasswordVisibility(): void {
    this.ShowConfirmPassword = !this.ShowConfirmPassword;
  }

  // Procesamiento y envío del formulario de registro de usuario
  public OnSubmit(): void {
    // Validación previa de campos antes del envío
    if (this.RegisterForm.invalid) {
      this.RegisterForm.markAllAsTouched();
      return;
    }

    // Activación del estado de carga y limpieza de alertas
    this.IsLoading = true;
    this.ErrorMessage = null;
    this.SuccessMessage = null;

    // Simulación del proceso de registro con redirección al Login
    setTimeout(() => {
      this.IsLoading = false;
      this.SuccessMessage = '¡Registro exitoso! Redirigiendo al inicio de sesión...';
      console.log('Payload de registro:', this.RegisterForm.value);
      setTimeout(() => {
        this.RouterService.navigate(['/auth/login']);
      }, 1500);
    }, 1200);
  }
}