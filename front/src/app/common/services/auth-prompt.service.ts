import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface AuthPromptOptions {
  title?: string;
  message?: string;
  returnUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthPromptService {
  private readonly router = inject(Router);

  readonly isOpen = signal<boolean>(false);
  readonly title = signal<string>('¡Únete a la conversación!');
  readonly message = signal<string>('Inicia sesión o regístrate para reaccionar, comentar y participar activamente en la comunidad.');
  readonly returnUrl = signal<string>('');

  open(options?: AuthPromptOptions): void {
    if (options?.title) this.title.set(options.title);
    else this.title.set('¡Únete a la conversación!');

    if (options?.message) this.message.set(options.message);
    else this.message.set('Inicia sesión o regístrate para reaccionar, comentar y participar activamente en la comunidad.');

    this.returnUrl.set(options?.returnUrl || this.router.url || '/');
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  goToLogin(): void {
    const url = this.returnUrl();
    this.close();
    this.router.navigate(['/auth/login'], {
      queryParams: url && url !== '/auth/login' ? { returnUrl: url } : undefined,
    });
  }

  goToRegister(): void {
    const url = this.returnUrl();
    this.close();
    this.router.navigate(['/auth/register'], {
      queryParams: url && url !== '/auth/register' ? { returnUrl: url } : undefined,
    });
  }
}
