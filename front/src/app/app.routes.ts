import { Routes } from '@angular/router';
import { About } from './about/about';
import { AppComponent } from './app';

export const routes: Routes = [
    { path: '', component: AppComponent },
    { path: 'about', component: About },
    { path: '**', redirectTo: '' },
];
