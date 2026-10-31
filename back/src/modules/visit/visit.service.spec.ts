import { VisitService } from './visit.service';

describe('VisitService - Prueba Unitaria 5.3 (Normalización de visitas)', () => {
  it('debe eliminar la query string antes de guardar una visita', async () => {
    const visitRepository = {
      create: jest.fn().mockImplementation((visit) => visit),
      save: jest.fn().mockResolvedValue({}),
    };
    const service = new VisitService(visitRepository as any);

    await expect(
      service.recordVisit(
        { path: '/eventos?pagina=2', visitorId: 'visitor-1', referrer: 'https://origen.test' },
        'Mozilla/5.0',
      ),
    ).resolves.toEqual({ success: true });

    expect(visitRepository.create).toHaveBeenCalledWith({
      path: '/eventos',
      visitorId: 'visitor-1',
      referrer: 'https://origen.test',
      userAgent: 'Mozilla/5.0',
    });
    expect(visitRepository.save).toHaveBeenCalled();
  });
});
