import { ForbiddenException } from '@nestjs/common';
import { CommentService } from './comment.service';

describe('CommentService - Prueba Unitaria 5.2 (Propiedad del comentario)', () => {
  it('debe impedir que un usuario elimine un comentario ajeno', async () => {
    const comment = {
      index: 7,
      content: 'Comentario de prueba',
      author: { index: 10 },
      publication: { title: 'Publicación', uuid: 'pub-1' },
    };
    const commentRepository = {
      findOne: jest.fn().mockResolvedValue(comment),
      softRemove: jest.fn(),
    };
    const notificationService = {
      createCommentModerationNotification: jest.fn(),
    };
    const service = new CommentService(
      commentRepository as any,
      {} as any,
      notificationService as any,
    );

    await expect(
      service.remove('comment-1', { index: 20, role: 'user' }),
    ).rejects.toThrow(
      new ForbiddenException('No puedes eliminar un comentario que no es tuyo'),
    );
    expect(commentRepository.softRemove).not.toHaveBeenCalled();
  });
});
