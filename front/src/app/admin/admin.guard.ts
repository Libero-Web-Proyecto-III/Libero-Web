import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

// # Este bloque tiene como objetivo restringir el acceso a las rutas del panel de administración únicamente a usuarios con rol de Administrador
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/auth/login']);
  }

  if (authService.isAdmin()) {
    return true;
  }

  return router.createUrlTree(['/']);
};
