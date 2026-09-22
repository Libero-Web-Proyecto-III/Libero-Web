import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VisitTrackerService } from './core/services/visit-tracker.service';

@Component({
  selector: 'app-root',
  imports: [ RouterOutlet ],
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
