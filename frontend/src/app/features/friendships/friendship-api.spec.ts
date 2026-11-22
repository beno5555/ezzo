import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AcceptedFriendshipDto } from './accepted-friendship-dto';
import { FriendshipApi } from './friendship-api';
import { StandardFriendshipDto } from './standard-friendship-dto';

describe('FriendshipApi', () => {
  let friendshipApi: FriendshipApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    friendshipApi = TestBed.inject(FriendshipApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('GET /api/friendships/pending', () => {
    it('sends the page as the query, and returns the incoming requests', async () => {
      const request: StandardFriendshipDto = {
        otherUser: { id: 3, username: 'alice' },
        status: 'Pending',
        sentAt: '2026-11-18T10:00:00Z',
        lastUpdatedAt: null,
      };
      const pending = friendshipApi.getPendingRequests({ pageNumber: 1, pageSize: 100 });

      const sent = httpTesting.expectOne(
        (candidate) => candidate.method === 'GET' && candidate.url === '/api/friendships/pending',
      );
      expect(sent.request.params.get('pageNumber')).toBe('1');
      expect(sent.request.params.get('pageSize')).toBe('100');
      sent.flush({ succeeded: true, message: null, data: [request], totalCount: 1 });

      expect(await pending).toEqual({ succeeded: true, data: [request] });
    });

    it('turns a bodiless 401 into a failure', async () => {
      const pending = friendshipApi.getPendingRequests({ pageNumber: 1, pageSize: 100 });

      httpTesting
        .expectOne('/api/friendships/pending?pageNumber=1&pageSize=100')
        .flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(await pending).toMatchObject({ succeeded: false, status: 401 });
    });
  });

  describe('GET /api/friendships/accepted/{friendId}', () => {
    it('returns the friendship with the friend and their presence', async () => {
      const friendship: AcceptedFriendshipDto = {
        otherUser: { id: 3, username: 'alice', lastActiveAt: null, isActive: true },
        status: 'Accepted',
        sentAt: '2026-11-18T10:00:00Z',
        lastUpdatedAt: '2026-11-18T11:00:00Z',
      };
      const pending = friendshipApi.getAcceptedFriendship(3);

      httpTesting
        .expectOne(
          (candidate) =>
            candidate.method === 'GET' && candidate.url === '/api/friendships/accepted/3',
        )
        .flush({ succeeded: true, message: null, data: friendship });

      expect(await pending).toEqual({ succeeded: true, data: friendship });
    });

    it('returns a not-found failure when the two are not friends', async () => {
      const pending = friendshipApi.getAcceptedFriendship(4);

      httpTesting
        .expectOne('/api/friendships/accepted/4')
        .flush(
          { succeeded: false, message: 'Friendship not found' },
          { status: 404, statusText: 'Not Found' },
        );

      expect(await pending).toEqual({
        succeeded: false,
        message: 'Friendship not found',
        status: 404,
      });
    });
  });
});
