import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

// Rutas del apartado Auth: conectan las URLs de login y registro con sus componentes.
export const AUTH_ROUTES: Routes = [
  // Muestra el formulario de inicio de sesión.
  { path: 'login', component: LoginComponent },
  // Muestra el formulario de creación de cuenta.
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  // Usa login como pantalla inicial del apartado Auth.
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
