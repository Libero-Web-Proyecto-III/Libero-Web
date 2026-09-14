import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { finalize, timeout } from 'rxjs';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: '../login/login.component.scss',
})
export class ResetPasswordComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly form = this.formBuilder.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(50)]],
    confirmation: ['', [Validators.required]],
  });
  readonly token = this.route.snapshot.queryParamMap.get('token') || '';
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  submit(): void {
    this.form.controls.confirmation.setErrors(
      this.form.controls.confirmation.value === this.form.controls.password.value ? null : { mismatch: true },
    );
    if (!this.token || this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = this.token ? '' : 'El enlace de recuperación no es válido.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.authService.resetPassword(this.token, this.form.controls.password.value).pipe(
      timeout(15000),
      finalize(() => {
        this.isLoading = false;
        this.changeDetector.markForCheck();
      }),
    ).subscribe({
      next: response => {
        this.successMessage = response.message;
        this.form.reset();
        this.router.navigate(['/auth/login'], { queryParams: { reset: 'success' } });
      },
      error: error => {
        console.error('Error restableciendo contraseña:', error);
        this.errorMessage = 'El enlace no es válido o ha expirado.';
      },
    });
  }
}
