import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoticeComponent } from '../../app/notice/notice.component';
import { ReactionService } from '../../app/notice/services/reaction.service';
import { AuthService } from '../../app/auth/services/auth.service';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { signal } from '@angular/core';

describe('NoticeComponent - Prueba Unitaria 3.1 (Frontend: Toggle de Reacción)', () => {
  let component: NoticeComponent;
  let reactionServiceMock: { toggle: ReturnType<typeof vi.fn> };

  const mockPub = (likes: number, userReaction: 'like' | null) => ({
    uuid: 'pub-1', likes, dislikes: 0, userReaction,
  });

  beforeEach(() => {
    reactionServiceMock = { toggle: vi.fn() };

    TestBed.configureTestingModule({
      imports: [NoticeComponent],
      providers: [
        provideRouter([]),
        { provide: ReactionService, useValue: reactionServiceMock },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal(null),
            isLoggedIn: signal(true),
            getToken: () => 'token',
          },
        },
      ],
    });

    component = TestBed.createComponent(NoticeComponent).componentInstance;
  });

  it('debe decrementar likes y anular userReaction al recibir action removed (toggle)', () => {
    component.news.set([mockPub(5, 'like') as any]);
    reactionServiceMock.toggle.mockReturnValue(of({ action: 'removed', reaction: null }));

    component.toggleReaction('pub-1', 'like');

    const pub = component.news().find(p => p.uuid === 'pub-1');
    expect(pub?.likes).toBe(4);
    expect(pub?.userReaction).toBeNull();
  });

  it('debe incrementar likes y asignar userReaction al recibir action created', () => {
    component.news.set([mockPub(5, null) as any]);
    reactionServiceMock.toggle.mockReturnValue(of({ action: 'created', reaction: { type: 'like' } }));

    component.toggleReaction('pub-1', 'like');

    const pub = component.news().find(p => p.uuid === 'pub-1');
    expect(pub?.likes).toBe(6);
    expect(pub?.userReaction).toBe('like');
  });
});
