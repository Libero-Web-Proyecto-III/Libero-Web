import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QuestionTypeEnum, SubmitAnswerDto, Survey } from '../../models/survey.model';
import { SurveyService } from '../../services/survey.service';
import { AuthService } from '../../../auth/services/auth.service';

// # Este bloque tiene como objetivo implementar el componente interactivo exigiendo registro/inicio de sesión obligatorio y respuesta única por usuario (RF-18)
@Component({
  selector: 'app-survey-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './survey-viewer.component.html',
  styleUrl: './survey-viewer.component.scss',
})
export class SurveyViewerComponent implements OnInit {
  private readonly surveyService = inject(SurveyService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  @Input() surveyId!: number;
  survey: Survey | null = null;
  isLoading = true;
  isSubmitted = false;
  isLoggedIn = false;
  hasAlreadyResponded = false;
  errorMessage = '';

  // Almacenamiento local de respuestas ingresadas por el usuario
  answersMap: Record<number, { optionId?: number; optionIds?: number[]; textValue?: string }> = {};

  ngOnInit(): void {
    this.isLoggedIn = !!this.authService.getToken();
    if (this.surveyId) {
      this.loadSurvey();
      if (this.isLoggedIn) {
        this.checkUserResponseStatus();
      }
    }
  }

  // # Este bloque tiene como objetivo consultar al backend si el usuario autenticado ya ha enviado sus respuestas a esta encuesta
  checkUserResponseStatus(): void {
    this.surveyService.getUserStatus(this.surveyId).subscribe({
      next: (res) => {
        this.hasAlreadyResponded = !!res?.responded;
      },
      error: () => {},
    });
  }

  // # Este bloque tiene como objetivo redirigir al usuario al módulo de autenticación cuando presiona el botón "Regístrate para participar"
  goToAuth(): void {
    this.router.navigate(['/auth/login']);
  }

  // # Este bloque tiene como objetivo cargar el detalle completo de la encuesta desde el backend
  loadSurvey(): void {
    this.isLoading = true;
    this.surveyService.getSurveyById(this.surveyId).subscribe({
      next: (data) => {
        this.survey = data;
        this.isLoading = false;
        this.initAnswersMap();
      },
      error: () => {
        this.errorMessage = 'No fue posible cargar la encuesta especificada.';
        this.isLoading = false;
      },
    });
  }

  // # Este bloque tiene como objetivo inicializar la estructura local para guardar la selección de respuestas
  private initAnswersMap(): void {
    if (!this.survey) return;
    this.survey.questions.forEach((q) => {
      this.answersMap[q.index] = {
        optionIds: [],
        textValue: '',
      };
    });
  }

  // # Este bloque tiene como objetivo manejar la selección en preguntas de tipo opción múltiple (Checkboxes)
  toggleMultipleOption(questionId: number, optionId: number): void {
    if (!this.answersMap[questionId]) {
      this.answersMap[questionId] = { optionIds: [] };
    }
    const currentList = this.answersMap[questionId].optionIds || [];
    const index = currentList.indexOf(optionId);
    if (index > -1) {
      currentList.splice(index, 1);
    } else {
      currentList.push(optionId);
    }
    this.answersMap[questionId].optionIds = [...currentList];
  }

  // # Este bloque tiene como objetivo verificar si una opción está marcada en preguntas de opción múltiple
  isOptionChecked(questionId: number, optionId: number): boolean {
    return (this.answersMap[questionId]?.optionIds || []).includes(optionId);
  }

  // # Este bloque tiene como objetivo verificar si el texto ingresado contiene palabras o expresiones inapropiadas o groseras
  private checkProfanity(text: string): boolean {
    if (!text) return false;
    const banned = [
      'puta', 'puto', 'putas', 'putos', 'perra', 'perro', 'gonorrea', 'hijueputa',
      'hijo de puta', 'hp', 'pendejo', 'pendeja', 'mierda', 'malparido', 'maricon',
      'marica', 'cabron', 'verga', 'picha', 'pene', 'vagina', 'chimba', 'huevon',
      'fuck', 'shit', 'bitch', 'asshole', 'cunt'
    ];
    const normalized = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[013457@\$!\*\.\-\_\+\=\#]/g, '');
    return banned.some(word => {
      const regex = new RegExp(`\\b${word}|${word}\\b`, 'i');
      return regex.test(normalized);
    });
  }

  // # Este bloque tiene como objetivo validar y enviar la encuesta completada al servidor backend
  onSubmit(): void {
    this.errorMessage = '';
    if (!this.survey) return;

    const answersDto: SubmitAnswerDto[] = [];

    for (const q of this.survey.questions) {
      const entry = this.answersMap[q.index];
      const hasOption = entry?.optionId !== undefined && entry.optionId !== null;
      const hasOptions = entry?.optionIds && entry.optionIds.length > 0;
      const hasText = entry?.textValue && entry.textValue.trim() !== '';

      if (q.isRequired && !hasOption && !hasOptions && !hasText) {
        this.errorMessage = `La pregunta "${q.title}" es obligatoria.`;
        return;
      }

      if (hasText && this.checkProfanity(entry.textValue!)) {
        this.errorMessage = `Tu respuesta a "${q.title}" contiene expresiones o palabras no permitidas por las políticas de respeto.`;
        return;
      }

      if (hasOption || hasOptions || hasText) {
        answersDto.push({
          questionId: q.index,
          optionId: entry.optionId,
          optionIds: entry.optionIds,
          textValue: entry.textValue,
        });
      }
    }

    this.surveyService.submitResponse(this.survey.index, { answers: answersDto }).subscribe({
      next: () => {
        this.isSubmitted = true;
        this.hasAlreadyResponded = true;
      },
      error: (err) => {
        const msg = err?.error?.message || '';
        if (msg.includes('Ya has respondido')) {
          this.hasAlreadyResponded = true;
        } else if (err.status === 401 || msg.includes('Debes registrarte')) {
          this.isLoggedIn = false;
        } else {
          this.errorMessage = msg || 'Error al enviar las respuestas. Revisa los datos ingresados.';
        }
      },
    });
  }
}
