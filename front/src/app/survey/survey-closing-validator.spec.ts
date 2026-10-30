import { FormControl } from '@angular/forms';
import { surveyClosingValidator } from './survey-closing-validator';

describe('SurveyClosingValidator - Prueba Unitaria 4.2', () => {
  const validator = surveyClosingValidator();

  it('debe marcar { pastDate: true } si la fecha u hora es pasada', () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
    const control = new FormControl({ date: yesterday, hour12: '10', minute: '00', amPm: 'AM' });

    expect(validator(control)).toEqual({ pastDate: true });
  });

  it('debe retornar null (válido) si la fecha es futura (ej. mañana 03:30 PM)', () => {
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];
    const control = new FormControl({ date: tomorrow, hour12: '03', minute: '30', amPm: 'PM' });

    expect(validator(control)).toBeNull();
  });
});
