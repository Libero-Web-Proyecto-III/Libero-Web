import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { CommentService } from '../../app/notice/services/comment.service';
import { AuthService } from '../../app/auth/services/auth.service';

describe('th.CommentService', () => {
  let service: CommentService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CommentService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            currentUser: () => ({
              username: 'thomas',
              avatar: '/avatar.png',
              role: 'user',
            }),
            getToken: () => 'token-de-prueba',
          },
        },
      ],
    });
    service = TestBed.inject(CommentService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpController.verify());

  it('convierte una respuesta paginada en comentarios listos para la vista', () => {
    service.findByPublication('pub-1').subscribe((comments) => {
      expect(comments[0]).toMatchObject({
        uuid: 'comment-1',
        author: 'Ana',
        authorRole: 'mod',
        authorTag: 'Voluntaria',
        authorTagColor: '#0a0',
        content: 'Información útil',
        likes: 0,
        dislikes: 0,
        userReaction: null,
      });
      expect(comments[0].createdAt).toEqual(new Date('2026-10-30T12:00:00.000Z'));
    });

    const request = httpController.expectOne((req) => req.url.endsWith('/comments'));
    expect(request.request.params.get('publicationUuid')).toBe('pub-1');
    expect(request.request.params.get('limit')).toBe('50');
    request.flush({
      data: [
        {
          index: 4,
          uuid: 'comment-1',
          content: 'Información útil',
          author: {
            index: 8,
            uuid: 'user-1',
            name: 'Ana',
            avatar: '/avatar.png',
            rol: { name: 'MOD' },
            tag: { name: ' Voluntaria ', color: ' #0a0 ' },
            tags: [{ name: 'Voluntaria', color: '#0a0' }],
          },
          createdAt: '2026-10-30T12:00:00.000Z',
          updatedAt: '2026-10-30T12:00:00.000Z',
        },
      ],
    });
  });
});
