import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./events/events.component').then(m => m.EventsComponent)
  },
  {
    path: 'events',
    loadComponent: () => import('./events/events.component').then(m => m.EventsComponent)
  },
  {
    path: 'eventos',
    loadComponent: () => import('./events/events.component').then(m => m.EventsComponent)
  }
];
