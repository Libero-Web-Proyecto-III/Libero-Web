import { BadRequestException } from '@nestjs/common';
import { SurveyService } from './survey.service';
import { SurveyStatusEnum } from './enums/survey.enum';

describe('SurveyService - Prueba Unitaria 4.1 (Voto Único)', () => {
  it('debe bloquear un segundo intento de voto y lanzar BadRequestException', async () => {
    // Arrange: Mocks mínimos necesarios para la regla de negocio
    const surveyRepo = {
      findOne: jest.fn().mockResolvedValue({ status: SurveyStatusEnum.PUBLISHED }),
    };
    const responseRepo = {
      findOne: jest.fn().mockResolvedValue({ index: 100 }), // Simula que ya votó
    };

    const service = new SurveyService(
      surveyRepo as any,
      {} as any,
      {} as any,
      responseRepo as any,
      {} as any,
    );

    // Act & Assert: Intento de voto con usuario ya registrado
    await expect(
      service.submitResponse(1, {} as any, { id: 55 }),
    ).rejects.toThrow(
      new BadRequestException(
        'Ya has respondido previamente a esta encuesta. Solo se permite 1 participación por usuario.',
      ),
    );
  });
});
