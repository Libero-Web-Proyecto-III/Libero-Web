import { Routes } from '@angular/router';
import { About } from './about/about';
import { AppComponent } from './app';
import { NoticeComponent } from './notice/notice.component';

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
      path: '',
      loadComponent: () =>
        import('./home/home.component').then(m => m.HomeComponent),
    },
    { path: 'about', component: About },
    { path: 'noticias', component: NoticeComponent },
    { path: '**', redirectTo: '' },
];
