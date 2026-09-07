import {
  Component,
  signal,
  HostListener,
  ViewChild,
  ViewChildren,
  QueryList,
  ElementRef,
  AfterViewInit,
  inject,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';

export interface NavLink {
  label: string;
  path: string;
  exact: boolean;
  fragment?: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  private routerSub?: Subscription;

  menuOpen = signal(false);
  scrolled = signal(false);

  activeLinkIndex = signal<number>(0);
  hoveredIndex = signal<number | null>(null);
  isAnimated = signal<boolean>(false);

  indicatorStyle = signal<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  @ViewChild('navContainer') navContainer!: ElementRef<HTMLUListElement>;
  @ViewChildren('navLinkEl') navLinkEls!: QueryList<ElementRef<HTMLAnchorElement>>;

  navLinks: NavLink[] = [
    { label: 'Inicio', path: '/', exact: true },
    { label: 'Eventos', path: '/eventos', exact: false },
    { label: 'Noticias', path: '/noticias', exact: false },
    { label: 'Quiénes Somos', path: '/about', exact: false },
  ];

  ngAfterViewInit(): void {
    this.updateActiveLinkFromRoute();

    // Activar transiciones después del primer render para evitar la animación inicial desde la izquierda
    setTimeout(() => {
      this.updateIndicator();
      requestAnimationFrame(() => {
        setTimeout(() => this.isAnimated.set(true), 50);
      });
    }, 30);

    // Escuchar cambios de ruta para mover el contorno deslizable automáticamente
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        this.updateActiveLinkFromRoute();
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  onMouseEnterLink(index: number): void {
    this.hoveredIndex.set(index);
    this.updateIndicator();
  }

  onMouseLeaveLinks(): void {
    this.hoveredIndex.set(null);
    this.updateIndicator();
  }

  onClickLink(index: number): void {
    this.activeLinkIndex.set(index);
    this.hoveredIndex.set(null);
    this.updateIndicator();
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }

  private updateActiveLinkFromRoute(): void {
    const currentUrl = this.router.url.split('?')[0].split('#')[0];
    const index = this.navLinks.findIndex(link => {
      if (link.exact) {
        return currentUrl === link.path;
      }
      return currentUrl.startsWith(link.path) && link.path !== '/';
    });

    const targetIdx = index >= 0 ? index : 0;
    this.activeLinkIndex.set(targetIdx);
    this.updateIndicator();
  }

  private updateIndicator(): void {
    const targetIdx = this.hoveredIndex() !== null ? this.hoveredIndex()! : this.activeLinkIndex();

    if (targetIdx < 0 || !this.navLinkEls || !this.navContainer) {
      this.indicatorStyle.update(s => ({ ...s, opacity: 0 }));
      return;
    }

    const linkArray = this.navLinkEls.toArray();
    const linkEl = linkArray[targetIdx]?.nativeElement;
    const containerEl = this.navContainer.nativeElement;

    if (linkEl && containerEl) {
      const containerRect = containerEl.getBoundingClientRect();
      const linkRect = linkEl.getBoundingClientRect();

      this.indicatorStyle.set({
        left: linkRect.left - containerRect.left,
        width: linkRect.width,
        opacity: 1,
      });
    }
  }

  toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.scrolled.set(window.scrollY > 50);
  }

  @HostListener('window:resize', [])
  onWindowResize(): void {
    this.updateIndicator();
  }
}
