import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';

// # Este bloque tiene como objetivo interceptar todas las peticiones HTTP salientes e inyectar automáticamente la cabecera Authorization Bearer Token
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const isApiUrl = req.url.startsWith('http://localhost:3000');

  if (token && isApiUrl) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req);
};
