import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { AuthPromptService } from '../../common/services/auth-prompt.service';

// # Este bloque tiene como objetivo capturar respuestas HTTP 401 Unauthorized en acciones públicas y rutas protegidas
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const authPromptService = inject(AuthPromptService);

  return next(req).pipe(
    catchError((error) => {
      const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/register');
      if (!isAuthEndpoint && error.status === 401) {
        const hasActiveSession = !!authService.getToken();
        if (hasActiveSession) {
          authService.logout();
          router.navigate(['/auth/login'], {
            queryParams: { sessionExpired: 'true' },
          });
        } else {
          // El usuario no tenía sesión activa: no redirigir ni mostrar falso "Sesión expirada"
          authPromptService.open({
            title: '¡Únete a la conversación!',
            message: 'Inicia sesión o regístrate para reaccionar, comentar y participar en Líbero Cobre.',
            returnUrl: router.url,
          });
        }
      }
      return throwError(() => error);
    }),
  );
};
