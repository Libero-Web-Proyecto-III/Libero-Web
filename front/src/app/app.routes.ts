import { Routes } from '@angular/router';
import { About } from './about/about';
import { AppComponent } from './app';
import { NoticeComponent } from './notice/notice.component';
import { adminGuard } from './admin/admin.guard';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'eventos',
    loadComponent: () => import('./events/events.component').then(m => m.EventsComponent)
  },
  {
    path: 'pqr',
    loadComponent: () => import('./pqr/pqr.component').then(m => m.PqrComponent)
  },
  {
    path: '',
    loadComponent: () =>
      import('./home/home.component').then(m => m.HomeComponent),
  },
  { path: 'about', component: About },
  { path: 'noticias', component: NoticeComponent },
    {
      path: 'config',
      canActivate: [authGuard],
      loadComponent: () => import('./config/config.component').then(m => m.ConfigComponent),
    },
    {
      path: 'admin',
      canActivate: [adminGuard],
      canActivateChild: [adminGuard],
      children: [
        { path: '', redirectTo: 'metricas', pathMatch: 'full' },
        { path: ':tab', loadComponent: () => import('./admin/admin.component').then(m => m.AdminComponent) },
      ],
    },
  { path: '**', redirectTo: '' },
];