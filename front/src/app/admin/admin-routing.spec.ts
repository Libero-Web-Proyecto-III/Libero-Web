import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { routes } from '../app.routes';
import { ADMIN_ROUTE_TAB_MAP, ADMIN_TAB_TO_ROUTE } from './admin.component';

describe('Admin Subroutes and Tab Mapping', () => {
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  describe('Route to Tab Mapping (ADMIN_ROUTE_TAB_MAP)', () => {
    it('should map Spanish routes to their corresponding admin tabs', () => {
      expect(ADMIN_ROUTE_TAB_MAP['metricas']).toBe('metrics');
      expect(ADMIN_ROUTE_TAB_MAP['home']).toBe('metrics');
      expect(ADMIN_ROUTE_TAB_MAP['eventos']).toBe('events');
      expect(ADMIN_ROUTE_TAB_MAP['noticias']).toBe('news');
      expect(ADMIN_ROUTE_TAB_MAP['encuestas']).toBe('polls');
      expect(ADMIN_ROUTE_TAB_MAP['usuarios']).toBe('users');
      expect(ADMIN_ROUTE_TAB_MAP['configuracion']).toBe('settings');
    });

    it('should map English aliases to their corresponding admin tabs', () => {
      expect(ADMIN_ROUTE_TAB_MAP['metrics']).toBe('metrics');
      expect(ADMIN_ROUTE_TAB_MAP['events']).toBe('events');
      expect(ADMIN_ROUTE_TAB_MAP['news']).toBe('news');
      expect(ADMIN_ROUTE_TAB_MAP['polls']).toBe('polls');
      expect(ADMIN_ROUTE_TAB_MAP['users']).toBe('users');
      expect(ADMIN_ROUTE_TAB_MAP['settings']).toBe('settings');
    });
  });

  describe('Tab to Route Mapping (ADMIN_TAB_TO_ROUTE)', () => {
    it('should map admin tabs to structured Spanish route segments', () => {
      expect(ADMIN_TAB_TO_ROUTE['metrics']).toBe('metricas');
      expect(ADMIN_TAB_TO_ROUTE['home']).toBe('metricas');
      expect(ADMIN_TAB_TO_ROUTE['events']).toBe('eventos');
      expect(ADMIN_TAB_TO_ROUTE['news']).toBe('noticias');
      expect(ADMIN_TAB_TO_ROUTE['polls']).toBe('encuestas');
      expect(ADMIN_TAB_TO_ROUTE['users']).toBe('usuarios');
      expect(ADMIN_TAB_TO_ROUTE['settings']).toBe('configuracion');
    });
  });

  describe('App Routes Configuration for /admin', () => {
    it('should have admin route configured with children and redirect to metricas', () => {
      const adminRoute = routes.find((r) => r.path === 'admin');
      expect(adminRoute).toBeDefined();
      expect(adminRoute?.children).toBeDefined();

      const defaultChild = adminRoute?.children?.find((c) => c.path === '');
      expect(defaultChild?.redirectTo).toBe('metricas');
      expect(defaultChild?.pathMatch).toBe('full');

      const tabChild = adminRoute?.children?.find((c) => c.path === ':tab');
      expect(tabChild).toBeDefined();
    });
  });
});
