import { Component, EventEmitter, HostListener, Input, Output, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-terms-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terms-modal.component.html',
  styleUrls: ['./terms-modal.component.scss'],
})
export class TermsModalComponent implements OnChanges, OnDestroy {
  @Input() isOpen: boolean = false;
  @Input() activeTab: 'terms' | 'privacy' = 'terms';
  @Output() close = new EventEmitter<void>();

  public currentTab: 'terms' | 'privacy' = 'terms';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activeTab'] && changes['activeTab'].currentValue) {
      this.currentTab = changes['activeTab'].currentValue;
    }
    if (changes['isOpen']) {
      if (this.isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (this.isOpen) {
      this.closeModal();
    }
  }

  public setTab(tab: 'terms' | 'privacy'): void {
    this.currentTab = tab;
  }

  public closeModal(): void {
    this.close.emit();
  }

  public onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closeModal();
    }
  }
}
