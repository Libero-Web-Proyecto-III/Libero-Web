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

// # Este bloque tiene como objetivo implementar una directiva estructural para ocultar o mostrar elementos en el DOM según el rol del usuario autenticado
@Directive({
  selector: '[hasRole], [appHasRole]',
  standalone: true,
})
export class HasRoleDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);

  private readonly requiredRoles = signal<string[]>([]);
  private readonly elseTemplateRef = signal<TemplateRef<unknown> | null>(null);

  private isViewCreated = false;
  private isElseCreated = false;

  @Input('hasRole') set hasRoleInput(value: string | string[] | null | undefined) {
    if (!value) {
      this.requiredRoles.set([]);
    } else if (Array.isArray(value)) {
      this.requiredRoles.set(value);
    } else {
      this.requiredRoles.set([value]);
    }
  }

  @Input('appHasRole') set appHasRoleInput(value: string | string[] | null | undefined) {
    this.hasRoleInput = value;
  }

  @Input('hasRoleElse') set hasRoleElse(templateRef: TemplateRef<unknown> | null) {
    this.elseTemplateRef.set(templateRef);
  }

  @Input('appHasRoleElse') set appHasRoleElse(templateRef: TemplateRef<unknown> | null) {
    this.elseTemplateRef.set(templateRef);
  }

  constructor() {
    effect(() => {
      // Subscripción reactiva al cambio de estado en currentUser
      const _user = this.authService.currentUser();
      const roles = this.requiredRoles();
      const hasAccess = roles.length > 0 ? this.authService.hasRole(roles) : false;

      if (hasAccess) {
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
