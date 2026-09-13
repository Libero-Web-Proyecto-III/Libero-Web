import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SurveyResults } from '../../models/survey.model';
import { SurveyService } from '../../services/survey.service';

// # Este bloque tiene como objetivo implementar el componente administrativo para visualizar estadísticas y gráficos de resultados de encuestas (RF-18)
@Component({
  selector: 'app-survey-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './survey-results.component.html',
  styleUrl: './survey-results.component.scss',
})
export class SurveyResultsComponent implements OnInit, OnChanges {
  private readonly surveyService = inject(SurveyService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() surveyId!: number;
  results: SurveyResults | null = null;
  isLoading = true;
  errorMessage = '';
  activeTab: 'stats' | 'users' = 'stats';

  ngOnInit(): void {
    if (this.surveyId) {
      this.loadResults();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['surveyId'] && changes['surveyId'].currentValue) {
      this.loadResults();
    }
  }

  // # Este bloque tiene como objetivo obtener las estadísticas agregadas calculadas por el backend y asegurar refresco en la vista
  loadResults(): void {
    if (!this.surveyId) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.surveyService.getSurveyResults(this.surveyId).subscribe({
      next: (data) => {
        this.results = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'No fue posible cargar las estadísticas de esta encuesta.';
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  setTab(tab: 'stats' | 'users'): void {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }
}
