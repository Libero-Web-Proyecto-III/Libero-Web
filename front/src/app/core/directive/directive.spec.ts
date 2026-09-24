import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach } from 'vitest';
import { CanDirective } from './can.directive';
import { HasRoleDirective } from './has-role.directive';
import { AuthService, AuthUser } from '../../auth/services/auth.service';
import { RoleEnum } from '../enum/role.enum';

@Component({
  standalone: true,
  imports: [CanDirective, HasRoleDirective],
  template: `
    <div id="admin-can" *can="['view', 'admin']">Admin Can Panel</div>
    <div id="mod-can" *can="['edit', 'publication']">Mod Can Edit</div>
    <div id="role-admin" *hasRole="'admin'">Admin Role Panel</div>
    <div id="role-multi" *hasRole="['admin', 'mod']">Multi Role Panel</div>
    <div id="role-enum" *hasRole="RoleEnum.ADMIN">Enum Role Panel</div>
    <div id="role-else" *hasRole="'admin'; else fallbackTpl">Has Admin</div>
    <ng-template #fallbackTpl><div id="fallback-box">Fallback Content</div></ng-template>
  `,
})
class TestHostComponent {
  RoleEnum = RoleEnum;
}

describe('Directives: CanDirective & HasRoleDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let mockAuthService: {
    currentUser: ReturnType<typeof signal<AuthUser | null>>;
    getToken: () => string | null;
    isLoggedIn: () => boolean;
    isAdmin: () => boolean;
    isMod: () => boolean;
    hasRole: (roles: any) => boolean;
    can: (action: string, subject: string) => boolean;
  };

  beforeEach(async () => {
    const currentUserSignal = signal<AuthUser | null>(null);

    mockAuthService = {
      currentUser: currentUserSignal,
      getToken: () => (currentUserSignal() ? 'mock-token' : null),
      isLoggedIn: () => currentUserSignal() !== null,
      isAdmin: () => currentUserSignal()?.role === 'admin',
      isMod: () => currentUserSignal()?.role === 'mod',
      hasRole(roles: string | string[]) {
        if (!this.isLoggedIn()) return false;
        const userRole = currentUserSignal()?.role;
        const list = Array.isArray(roles) ? roles : [roles];
        return list.includes(userRole || '');
      },
      can(action: string, subject: string) {
        if (!this.isLoggedIn()) return false;
        if (this.isAdmin()) return true;
        if (currentUserSignal()?.role === 'mod' && action === 'edit' && subject === 'publication') return true;
        return false;
      },
    };

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should not render protected elements for guests', () => {
    expect(fixture.debugElement.query(By.css('#admin-can'))).toBeNull();
    expect(fixture.debugElement.query(By.css('#role-admin'))).toBeNull();
    expect(fixture.debugElement.query(By.css('#fallback-box'))).not.toBeNull();
  });

  it('should render elements for admin user', () => {
    mockAuthService.currentUser.set({
      id: 1,
      username: 'adminUser',
      email: 'admin@test.com',
      role: 'admin',
    });
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('#admin-can'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('#role-admin'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('#role-multi'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('#role-enum'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('#role-else'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('#fallback-box'))).toBeNull();
  });

  it('should render mod permissions correctly', () => {
    mockAuthService.currentUser.set({
      id: 2,
      username: 'modUser',
      email: 'mod@test.com',
      role: 'mod',
    });
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('#admin-can'))).toBeNull();
    expect(fixture.debugElement.query(By.css('#mod-can'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('#role-admin'))).toBeNull();
    expect(fixture.debugElement.query(By.css('#role-multi'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('#fallback-box'))).not.toBeNull();
  });
});
