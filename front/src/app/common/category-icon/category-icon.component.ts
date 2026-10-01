import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CategoryIconOption {
  id: string;
  name: string;
  label: string;
}

export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { id: 'megaphone', name: 'Megáfono', label: 'Comunicados y Avisos' },
  { id: 'newspaper', name: 'Noticias', label: 'Actualidad y Prensa' },
  { id: 'leaf', name: 'Medio Ambiente', label: 'Sostenibilidad y Ecología' },
  { id: 'settings', name: 'Operaciones', label: 'Técnico y Mantenimiento' },
  { id: 'calendar', name: 'Eventos', label: 'Fechas y Cronogramas' },
  { id: 'users', name: 'Comunidad', label: 'Social y Personas' },
  { id: 'briefcase', name: 'Institucional', label: 'Administración y Gestión' },
  { id: 'flask', name: 'Innovación', label: 'Ciencia y Tecnología' },
  { id: 'building', name: 'Infraestructura', label: 'Obras e Instalaciones' },
  { id: 'droplet', name: 'Recursos Hídricos', label: 'Agua y Servicios' },
  { id: 'zap', name: 'Energía', label: 'Electricidad y Proyectos' },
  { id: 'globe', name: 'Global', label: 'Internacional y Redes' },
  { id: 'shield', name: 'Seguridad', label: 'Salud y Prevención' },
  { id: 'award', name: 'Logros', label: 'Reconocimientos y Premios' },
  { id: 'sparkles', name: 'Novedades', label: 'Destacados y Especiales' },
  { id: 'heart', name: 'Bienestar', label: 'Responsabilidad Social' },
  { id: 'target', name: 'Estrategia', label: 'Objetivos y Metas' },
  { id: 'truck', name: 'Logística', label: 'Transporte y Distribución' },
  { id: 'bookmark', name: 'Interés', label: 'Relevante' },
  { id: 'folder', name: 'General', label: 'Archivo y Documentos' },
];

const EMOJI_TO_ICON_MAP: Record<string, string> = {
  '📢': 'megaphone',
  '📰': 'newspaper',
  '🌱': 'leaf',
  '⚙️': 'settings',
  '⚙': 'settings',
  '📅': 'calendar',
  '👥': 'users',
  '💼': 'briefcase',
  '🔬': 'flask',
  '🏗️': 'building',
  '🏗': 'building',
  '💧': 'droplet',
  '⚡': 'zap',
  '📁': 'folder',
  '🌍': 'globe',
  '🛡️': 'shield',
  '🏆': 'award',
  '✨': 'sparkles',
  '❤️': 'heart',
  '🎯': 'target',
  '🚚': 'truck',
};

@Component({
  selector: 'app-category-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="category-svg-icon-wrap" [class]="customClass" [style.width.px]="resolvedSize" [style.height.px]="resolvedSize" [style.color]="color || 'currentColor'">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        [attr.width]="resolvedSize"
        [attr.height]="resolvedSize"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        [attr.stroke-width]="strokeWidth"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="cat-svg"
      >
        <ng-container [ngSwitch]="resolvedIconKey">
          <!-- Megaphone -->
          <ng-container *ngSwitchCase="'megaphone'">
            <path d="m3 11 18-5v12L3 14v-3z"></path>
            <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path>
          </ng-container>

          <!-- Newspaper -->
          <ng-container *ngSwitchCase="'newspaper'">
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path>
            <path d="M18 14h-8"></path>
            <path d="M15 18h-5"></path>
            <path d="M10 6h8v4h-8V6Z"></path>
          </ng-container>

          <!-- Leaf -->
          <ng-container *ngSwitchCase="'leaf'">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
          </ng-container>

          <!-- Settings -->
          <ng-container *ngSwitchCase="'settings'">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </ng-container>

          <!-- Calendar -->
          <ng-container *ngSwitchCase="'calendar'">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </ng-container>

          <!-- Users -->
          <ng-container *ngSwitchCase="'users'">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </ng-container>

          <!-- Briefcase -->
          <ng-container *ngSwitchCase="'briefcase'">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </ng-container>

          <!-- Flask -->
          <ng-container *ngSwitchCase="'flask'">
            <path d="M10 2v7.31L4.75 18.1A2 2 0 0 0 6.48 21h11.04a2 2 0 0 0 1.73-2.9L14 9.31V2"></path>
            <line x1="8.5" y1="2" x2="15.5" y2="2"></line>
            <line x1="7" y1="14.5" x2="17" y2="14.5"></line>
          </ng-container>

          <!-- Building -->
          <ng-container *ngSwitchCase="'building'">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
            <line x1="9" y1="22" x2="9" y2="22.01"></line>
            <line x1="15" y1="22" x2="15" y2="22.01"></line>
            <line x1="8" y1="6" x2="8" y2="6.01"></line>
            <line x1="16" y1="6" x2="16" y2="6.01"></line>
            <line x1="8" y1="10" x2="8" y2="10.01"></line>
            <line x1="16" y1="10" x2="16" y2="10.01"></line>
            <line x1="8" y1="14" x2="8" y2="14.01"></line>
            <line x1="16" y1="14" x2="16" y2="14.01"></line>
            <line x1="8" y1="18" x2="8" y2="18.01"></line>
            <line x1="16" y1="18" x2="16" y2="18.01"></line>
          </ng-container>

          <!-- Droplet -->
          <ng-container *ngSwitchCase="'droplet'">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
          </ng-container>

          <!-- Zap -->
          <ng-container *ngSwitchCase="'zap'">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </ng-container>

          <!-- Globe -->
          <ng-container *ngSwitchCase="'globe'">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </ng-container>

          <!-- Shield -->
          <ng-container *ngSwitchCase="'shield'">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </ng-container>

          <!-- Award -->
          <ng-container *ngSwitchCase="'award'">
            <circle cx="12" cy="8" r="7"></circle>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
          </ng-container>

          <!-- Sparkles -->
          <ng-container *ngSwitchCase="'sparkles'">
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"></path>
          </ng-container>

          <!-- Heart -->
          <ng-container *ngSwitchCase="'heart'">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
          </ng-container>

          <!-- Target -->
          <ng-container *ngSwitchCase="'target'">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="6"></circle>
            <circle cx="12" cy="12" r="2"></circle>
          </ng-container>

          <!-- Truck -->
          <ng-container *ngSwitchCase="'truck'">
            <rect x="1" y="3" width="15" height="13"></rect>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
          </ng-container>

          <!-- Bookmark -->
          <ng-container *ngSwitchCase="'bookmark'">
            <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </ng-container>

          <!-- Folder / Default Fallback -->
          <ng-container *ngSwitchDefault>
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </ng-container>
        </ng-container>
      </svg>
    </span>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
      line-height: 1;
    }
    .category-svg-icon-wrap {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .cat-svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class CategoryIconComponent {
  @Input() icon: string | null | undefined = 'megaphone';
  @Input() size: number | string = 16;
  @Input() strokeWidth: number | string = 2;
  @Input() color?: string;
  @Input() customClass = '';

  get resolvedSize(): number {
    const num = Number(this.size);
    return isNaN(num) || num <= 0 ? 16 : num;
  }

  get resolvedIconKey(): string {
    const raw = (this.icon || '').trim();
    if (!raw) return 'megaphone';
    if (EMOJI_TO_ICON_MAP[raw]) return EMOJI_TO_ICON_MAP[raw];
    const lower = raw.toLowerCase();
    const validIds = CATEGORY_ICON_OPTIONS.map(o => o.id);
    if (validIds.includes(lower)) return lower;
    return 'folder';
  }
}
