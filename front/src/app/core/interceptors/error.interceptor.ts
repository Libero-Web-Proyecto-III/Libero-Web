import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';

// # Este bloque tiene como objetivo capturar respuestas HTTP 401 Unauthorized o 403 Forbidden, cerrar la sesión automáticamente y redirigir al login
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401 || error.status === 403) {
        authService.logout();
        router.navigate(['/auth/login'], {
          queryParams: { sessionExpired: 'true' },
        });
      }
      return throwError(() => error);
    }),
  );
};
