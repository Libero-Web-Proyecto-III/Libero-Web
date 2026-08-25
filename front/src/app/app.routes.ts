import { Routes } from '@angular/router';
import { About } from './about/about';
import { AppComponent } from './app';

export const routes: Routes = [
    {
      path: '',
      loadComponent: () =>
        import('./home/home.component').then(m => m.HomeComponent),
    },
    { path: 'about', component: About },
    { path: '**', redirectTo: '' },
];
