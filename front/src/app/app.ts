import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VisitTrackerService } from './core/services/visit-tracker.service';
import { AuthPromptModalComponent } from './common/auth-prompt-modal/auth-prompt-modal.component';

@Component({
  selector: 'app-root',
  imports: [ RouterOutlet, AuthPromptModalComponent ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class AppComponent implements OnInit {
  protected readonly title = signal('front');
  private readonly visitTracker = inject(VisitTrackerService);

  ngOnInit(): void {
    this.visitTracker.init();
  }
}
