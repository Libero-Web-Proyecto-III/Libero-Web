import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { QuestionTypeEnum, SurveyStatusEnum } from '../../models/survey.model';
import { SurveyService } from '../../services/survey.service';

// # Este bloque tiene como objetivo implementar la lógica del constructor dinámico de encuestas en Angular usando FormArray y programación de cierre automático
@Component({
  selector: 'app-survey-builder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './survey-builder.component.html',
  styleUrl: './survey-builder.component.scss',
})
export class SurveyBuilderComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly surveyService = inject(SurveyService);

  @Output() surveyCreated = new EventEmitter<void>();

  readonly questionTypes = [
    { label: 'Selección Única', value: QuestionTypeEnum.SINGLE_CHOICE },
    { label: 'Selección Múltiple', value: QuestionTypeEnum.MULTIPLE_CHOICE },
    { label: 'Texto Abierto', value: QuestionTypeEnum.OPEN_TEXT },
    { label: 'Puntuación / Escala (1-5)', value: QuestionTypeEnum.RATING },
  ];

  // Configuración de Estado y Tiempo Programado
  isDraft = false;
  hasAutoClose = false;
  closeDate = '';
  closeHour12 = '12';
  closeMinute = '00';
  closeAmPm: 'AM' | 'PM' = 'PM';
  minDateString = '';
  timeError = '';
  previewScheduledText = '';

  readonly hours12List: string[] = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  readonly minutesList: string[] = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  successMessage = '';
  errorMessage = '';
  isSubmitting = false;

  // # Este bloque define la estructura principal del formulario reactivo
  readonly surveyForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(4)]],
    description: [''],
    isPublic: [true],
    questions: this.fb.array([]),
  });

  constructor() {
    this.addQuestion();
  }

  ngOnInit(): void {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    this.minDateString = `${y}-${m}-${d}`;
  }

  // # Este bloque maneja la activación del cierre automático por tiempo
  toggleAutoClose(enabled: boolean): void {
    this.hasAutoClose = enabled;
    if (enabled) {
      if (!this.closeDate || this.closeDate < this.minDateString) {
        this.closeDate = this.minDateString;
      }
      const defaultTime = new Date();
      defaultTime.setHours(defaultTime.getHours() + 1);
      defaultTime.setMinutes(0);
      let h = defaultTime.getHours();
      this.closeAmPm = h >= 12 ? 'PM' : 'AM';
      let h12 = h % 12;
      if (h12 === 0) h12 = 12;
      this.closeHour12 = String(h12).padStart(2, '0');
      this.closeMinute = String(defaultTime.getMinutes()).padStart(2, '0');
      this.validateDateTime();
    } else {
      this.timeError = '';
      this.previewScheduledText = '';
    }
  }

  setAmPm(val: 'AM' | 'PM'): void {
    this.closeAmPm = val;
    this.validateDateTime();
  }

  // # Este bloque valida que no se puedan seleccionar fechas u horas pasadas
  validateDateTime(): boolean {
    if (!this.hasAutoClose) {
      this.timeError = '';
      this.previewScheduledText = '';
      return true;
    }

    if (!this.closeDate) {
      this.timeError = 'Por favor selecciona una fecha de cierre en el calendario.';
      this.previewScheduledText = '';
      return false;
    }

    if (this.closeDate < this.minDateString) {
      this.timeError = 'No puedes seleccionar una fecha pasada.';
      this.previewScheduledText = '';
      return false;
    }

    let h24 = parseInt(this.closeHour12, 10);
    if (this.closeAmPm === 'PM' && h24 < 12) h24 += 12;
    if (this.closeAmPm === 'AM' && h24 === 12) h24 = 0;
    const minVal = parseInt(this.closeMinute, 10);

    const [year, month, day] = this.closeDate.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day, h24, minVal, 0, 0);
    const now = new Date();

    if (selectedDate.getTime() <= now.getTime()) {
      this.timeError = 'No se pueden seleccionar horas o fechas pasadas. Elige una hora futura.';
      this.previewScheduledText = '';
      return false;
    }

    this.timeError = '';
    const dateFormatted = selectedDate.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    this.previewScheduledText = `${dateFormatted} a las ${this.closeHour12}:${this.closeMinute} ${this.closeAmPm}`;
    return true;
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

    if (this.hasAutoClose && !this.validateDateTime()) {
      this.errorMessage = this.timeError || 'La fecha y hora de cierre no es válida.';
      return;
    }

    this.isSubmitting = true;

    let endDateISO: string | undefined = undefined;
    if (this.hasAutoClose) {
      let h24 = parseInt(this.closeHour12, 10);
      if (this.closeAmPm === 'PM' && h24 < 12) h24 += 12;
      if (this.closeAmPm === 'AM' && h24 === 12) h24 = 0;
      const minVal = parseInt(this.closeMinute, 10);
      const [year, month, day] = this.closeDate.split('-').map(Number);
      const targetDate = new Date(year, month - 1, day, h24, minVal, 0, 0);
      endDateISO = targetDate.toISOString();
    }

    const payload = {
      title: this.surveyForm.value.title,
      description: this.surveyForm.value.description,
      isPublic: this.surveyForm.value.isPublic ?? true,
      status: this.isDraft ? SurveyStatusEnum.DRAFT : SurveyStatusEnum.PUBLISHED,
      endDate: endDateISO,
      questions: this.surveyForm.value.questions,
    };

    this.surveyService.createSurvey(payload as any).subscribe({
      next: (createdSurvey) => {
        this.isSubmitting = false;
        this.successMessage = `¡Encuesta "${createdSurvey.title}" ${this.isDraft ? 'guardada como borrador' : 'creada y publicada'} exitosamente!`;
        this.surveyForm.reset({
          isPublic: true,
        });
        this.isDraft = false;
        this.hasAutoClose = false;
        this.timeError = '';
        this.previewScheduledText = '';
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
