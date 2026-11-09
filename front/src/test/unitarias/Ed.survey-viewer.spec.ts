import { TestBed } from '@angular/core/testing';
import { SurveyViewerComponent } from '../../app/survey/components/survey-viewer/survey-viewer.component';
import { SurveyService } from '../../app/survey/services/survey.service';
import { AuthService } from '../../app/auth/services/auth.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('SurveyViewerComponent - Prueba Unitaria 4.1 (Frontend: Voto Único)', () => {
  let component: SurveyViewerComponent;
  let surveyServiceMock: { getUserStatus: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    surveyServiceMock = {
      getUserStatus: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [SurveyViewerComponent],
      providers: [
        { provide: SurveyService, useValue: surveyServiceMock },
        { provide: AuthService, useValue: { getToken: () => 'token' } },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });

    component = TestBed.createComponent(SurveyViewerComponent).componentInstance;
    component.surveyId = 10;
  });

  it('debe marcar hasAlreadyResponded en true si el usuario ya votó', () => {
    surveyServiceMock.getUserStatus.mockReturnValue(of({ responded: true }));

    component.checkUserResponseStatus();

    expect(component.hasAlreadyResponded).toBe(true);
  });

  it('debe mantener hasAlreadyResponded en false si el usuario no ha votado', () => {
    surveyServiceMock.getUserStatus.mockReturnValue(of({ responded: false }));

    component.checkUserResponseStatus();

    expect(component.hasAlreadyResponded).toBe(false);
  });
});
