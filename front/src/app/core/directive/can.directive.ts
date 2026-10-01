import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
  effect,
  signal,
} from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';

// # Este bloque tiene como objetivo implementar una directiva estructural equivalente a v-can para ocultar o mostrar elementos en el DOM según la acción y sujeto [action, subject]
@Directive({
  selector: '[can], [appCan]',
  standalone: true,
})
export class CanDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);

  private readonly permission = signal<[string, string] | null>(null);
  private readonly elseTemplateRef = signal<TemplateRef<unknown> | null>(null);

  private isViewCreated = false;
  private isElseCreated = false;

  @Input('can') set canInput(value: [string, string] | string[] | null | undefined) {
    if (Array.isArray(value) && value.length >= 2) {
      this.permission.set([value[0], value[1]]);
    } else {
      this.permission.set(null);
    }
  }

  @Input('appCan') set appCanInput(value: [string, string] | string[] | null | undefined) {
    this.canInput = value;
  }

  @Input('canElse') set canElse(templateRef: TemplateRef<unknown> | null) {
    this.elseTemplateRef.set(templateRef);
  }

  @Input('appCanElse') set appCanElse(templateRef: TemplateRef<unknown> | null) {
    this.elseTemplateRef.set(templateRef);
  }

  constructor() {
    effect(() => {
      // Subscripción reactiva al cambio de estado en currentUser
      const _user = this.authService.currentUser();
      const perm = this.permission();
      const hasPermission = perm ? this.authService.can(perm[0], perm[1]) : false;

      if (hasPermission) {
        if (!this.isViewCreated) {
          this.viewContainer.clear();
          this.viewContainer.createEmbeddedView(this.templateRef);
          this.isViewCreated = true;
          this.isElseCreated = false;
        }
      } else {
        const elseTpl = this.elseTemplateRef();
        if (elseTpl) {
          if (!this.isElseCreated) {
            this.viewContainer.clear();
            this.viewContainer.createEmbeddedView(elseTpl);
            this.isElseCreated = true;
            this.isViewCreated = false;
          }
        } else {
          this.viewContainer.clear();
          this.isViewCreated = false;
          this.isElseCreated = false;
        }
      }
    });
  }
}
