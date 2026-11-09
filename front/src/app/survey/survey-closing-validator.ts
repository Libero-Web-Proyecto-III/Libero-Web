import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface SurveyClosingValue {
  date: string;       // 'YYYY-MM-DD'
  hour12?: string;    // '01' - '12'
  minute?: string;    // '00' - '59'
  amPm?: 'AM' | 'PM';
}

/**
 * Validador reactivo para el cierre programado de encuestas.
 * Rechaza fechas y horas pasadas según el selector 12h (AM/PM).
 */
export function surveyClosingValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const val: SurveyClosingValue = control.value;
    if (!val?.date) return null;

    const [year, month, day] = val.date.split('-').map(Number);
    let hour = Number(val.hour12 || 12);
    if (val.amPm === 'PM' && hour < 12) hour += 12;
    if (val.amPm === 'AM' && hour === 12) hour = 0;

    const targetDate = new Date(year, month - 1, day, hour, Number(val.minute || 0));
    return targetDate.getTime() <= Date.now() ? { pastDate: true } : null;
  };
}
