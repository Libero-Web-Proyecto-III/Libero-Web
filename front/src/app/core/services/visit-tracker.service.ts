import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class VisitTrackerService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/visits`;
  private readonly storageKey = 'libero_visitor_uuid';

  private visitorId = '';
  private isInitialized = false;

  init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.visitorId = this.getOrCreateVisitorId();

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.trackPage(event.urlAfterRedirects);
      });
  }

  private trackPage(url: string): void {
    const cleanPath = (url || '/').split('?')[0].trim();

    // No registrar visitas a las rutas privadas del panel de administración
    if (cleanPath.startsWith('/admin')) {
      return;
    }

    const payload = {
      path: cleanPath || '/',
      visitorId: this.visitorId,
      referrer: typeof document !== 'undefined' && document.referrer ? document.referrer : 'direct',
    };

    this.http.post(this.apiUrl, payload).subscribe({
      error: () => {
        // Silencioso para no interferir con la navegación del usuario
      },
    });
  }

  private getOrCreateVisitorId(): string {
    if (typeof localStorage === 'undefined') {
      return 'anon-' + Math.random().toString(36).substring(2, 15);
    }

    let id = localStorage.getItem(this.storageKey);
    if (!id) {
      id = 'v-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
      try {
        localStorage.setItem(this.storageKey, id);
      } catch {
        // LocalStorage deshabilitado o modo incógnito restrictivo
      }
    }
    return id;
  }
}
