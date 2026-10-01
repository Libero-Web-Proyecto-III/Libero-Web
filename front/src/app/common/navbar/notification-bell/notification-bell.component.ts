import { Component, ElementRef, HostListener, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, NotificationItem } from '../../services/notification.service';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
})
export class NotificationBellComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  public readonly notificationService = inject(NotificationService);
  public readonly authService = inject(AuthService);

  readonly isOpen = signal(false);

  readonly notifications = this.notificationService.notifications;
  readonly unreadCount = this.notificationService.unreadCount;
  readonly isLoggedIn = this.authService.isLoggedIn;

  toggleDropdown(): void {
    const nextState = !this.isOpen();
    this.isOpen.set(nextState);
    if (nextState) {
      this.notificationService.loadNotifications();
    }
  }

  closeDropdown(): void {
    this.isOpen.set(false);
  }

  markAsRead(item: NotificationItem, event?: MouseEvent): void {
    event?.stopPropagation();
    if (!item.read) {
      this.notificationService.markAsRead(item.uuid).subscribe();
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }

  deleteNotification(item: NotificationItem, event: MouseEvent): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(item.uuid).subscribe();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.closeDropdown();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeDropdown();
  }
}
