import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
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
});
