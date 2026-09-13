import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { QuestionTypeEnum, SurveyStatusEnum } from '../../models/survey.model';
import { SurveyService } from '../../services/survey.service';

// # Este bloque tiene como objetivo implementar la lógica del constructor dinámico de encuestas en Angular usando FormArray
@Component({
  selector: 'app-survey-builder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './survey-builder.component.html',
  styleUrl: './survey-builder.component.scss',
})
export class SurveyBuilderComponent {
  private readonly fb = inject(FormBuilder);
  private readonly surveyService = inject(SurveyService);

  @Output() surveyCreated = new EventEmitter<void>();

  readonly questionTypes = [
    { label: 'Selección Única', value: QuestionTypeEnum.SINGLE_CHOICE },
    { label: 'Selección Múltiple', value: QuestionTypeEnum.MULTIPLE_CHOICE },
    { label: 'Texto Abierto', value: QuestionTypeEnum.OPEN_TEXT },
    { label: 'Puntuación / Escala (1-5)', value: QuestionTypeEnum.RATING },
  ];

  readonly surveyStatuses = [
    { label: 'Borrador', value: SurveyStatusEnum.DRAFT },
    { label: 'Publicada', value: SurveyStatusEnum.PUBLISHED },
    { label: 'Cerrada', value: SurveyStatusEnum.CLOSED },
  ];

  successMessage = '';
  errorMessage = '';
  isSubmitting = false;

  // # Este bloque tiene como objetivo definir la estructura principal del formulario reactivo con controles y arreglo de preguntas
  readonly surveyForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(4)]],
    description: [''],
    isPublic: [true],
    status: [SurveyStatusEnum.PUBLISHED, [Validators.required]],
    startDate: [''],
    endDate: [''],
    questions: this.fb.array([]),
  });

  constructor() {
    this.addQuestion();
  }

  // # Este bloque tiene como objetivo retornar el FormArray de preguntas para su manipulación dinámica
  get questions(): FormArray {
    return this.surveyForm.get('questions') as FormArray;
  }

  // # Este bloque tiene como objetivo retornar el FormArray de opciones de una pregunta específica
  getOptions(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('options') as FormArray;
  }

  // # Este bloque tiene como objetivo agregar una nueva pregunta dinámica al formulario en tiempo real
  addQuestion(): void {
    const questionGroup = this.fb.group({
      title: ['', [Validators.required]],
      type: [QuestionTypeEnum.SINGLE_CHOICE, [Validators.required]],
      isRequired: [true],
      options: this.fb.array([]),
    });

    const optionsArray = questionGroup.get('options') as FormArray;
    optionsArray.push(this.fb.group({ optionText: ['', Validators.required] }));
    optionsArray.push(this.fb.group({ optionText: ['', Validators.required] }));

    this.questions.push(questionGroup);
  }

  // # Este bloque tiene como objetivo eliminar una pregunta del formulario por su índice
  removeQuestion(index: number): void {
    if (this.questions.length > 1) {
      this.questions.removeAt(index);
    } else {
      this.errorMessage = 'La encuesta debe tener al menos una pregunta.';
    }
  }

  // # Este bloque tiene como objetivo agregar una nueva opción de respuesta a una pregunta de selección
  addOption(questionIndex: number): void {
    const options = this.getOptions(questionIndex);
    options.push(this.fb.group({ optionText: ['', Validators.required] }));
  }

  // # Este bloque tiene como objetivo eliminar una opción de respuesta de una pregunta por su índice
  removeOption(questionIndex: number, optionIndex: number): void {
    const options = this.getOptions(questionIndex);
    if (options.length > 2) {
      options.removeAt(optionIndex);
    } else {
      this.errorMessage = 'Las preguntas de selección deben tener al menos 2 opciones.';
    }
  }

  // # Este bloque tiene como objetivo adaptar la lista de opciones cuando el usuario cambia el tipo de pregunta
  onTypeChange(questionIndex: number): void {
    const question = this.questions.at(questionIndex);
    const type = question.get('type')?.value;
    const options = question.get('options') as FormArray;

    if (type === QuestionTypeEnum.OPEN_TEXT || type === QuestionTypeEnum.RATING) {
      options.clear();
    } else if (options.length === 0) {
      options.push(this.fb.group({ optionText: ['', Validators.required] }));
      options.push(this.fb.group({ optionText: ['', Validators.required] }));
    }
  }

  // # Este bloque tiene como objetivo procesar y enviar la encuesta dinámica construida al backend NestJS
  onSubmit(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.surveyForm.invalid) {
      this.errorMessage = 'Por favor completa todos los campos requeridos correctamente.';
      this.surveyForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const rawValue = this.surveyForm.value;

    this.surveyService.createSurvey(rawValue).subscribe({
      next: (createdSurvey) => {
        this.isSubmitting = false;
        this.successMessage = `¡Encuesta "${createdSurvey.title}" creada exitosamente!`;
        this.surveyForm.reset({
          isPublic: true,
          status: SurveyStatusEnum.PUBLISHED,
        });
        this.questions.clear();
        this.addQuestion();
        this.surveyCreated.emit();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage =
          err?.error?.message || 'Ocurrió un error al crear la encuesta. Verifica los permisos.';
      },
    });
  }
}
