import { ReactionService } from './reaction.service';
import { ReactionType } from './enum/reactionType.enum';

describe('ReactionService - Prueba Unitaria 3.1 (Unicidad Like/Dislike)', () => {
  const publicationMock = { uuid: 'pub-1', title: 'Noticia' };
  const userMock = { index: 10 };

  it('debe retirar la reacción (toggle) si el usuario repite el mismo tipo', async () => {
    const existingReaction = { id: 1, type: ReactionType.LIKE, publication: publicationMock, author: userMock };
    const reactionRepo = {
      findOne: jest.fn().mockResolvedValue(existingReaction),
      remove: jest.fn().mockResolvedValue(existingReaction),
    };
    const pubRepo = { findOne: jest.fn().mockResolvedValue(publicationMock) };

    const service = new ReactionService(reactionRepo as any, {} as any, pubRepo as any);
    const result = await service.react(
      { publicationUuid: 'pub-1', type: ReactionType.LIKE } as any,
      userMock as any,
    );

    expect(result.action).toBe('removed');
    expect(reactionRepo.remove).toHaveBeenCalledWith(existingReaction);
  });

  it('debe crear la reacción si el usuario no tenía ninguna previa', async () => {
    const newReaction = { id: 2, type: ReactionType.LIKE, publication: publicationMock, author: userMock };
    const reactionRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue(newReaction),
      save: jest.fn().mockResolvedValue(newReaction),
    };
    const pubRepo = { findOne: jest.fn().mockResolvedValue(publicationMock) };

    const service = new ReactionService(reactionRepo as any, {} as any, pubRepo as any);
    const result = await service.react(
      { publicationUuid: 'pub-1', type: ReactionType.LIKE } as any,
      userMock as any,
    );

    expect(result.action).toBe('created');
    expect(reactionRepo.save).toHaveBeenCalled();
  });
});
