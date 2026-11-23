import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AcceptedFriendshipDto } from './accepted-friendship-dto';
import { FriendshipApi } from './friendship-api';
import { MinimalFriendshipDto } from './minimal-friendship-dto';
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
        isRequester: false,
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

  describe('GET /api/friendships/{userId}', () => {
    it('returns the relationship with the user, and who sent the request', async () => {
      const relationship: StandardFriendshipDto = {
        otherUser: { id: 5, username: 'diana' },
        status: 'Pending',
        sentAt: '2026-11-18T10:00:00Z',
        lastUpdatedAt: null,
        isRequester: true,
      };

      const pending = friendshipApi.getRelationship(5);
      httpTesting
        .expectOne(
          (candidate) => candidate.method === 'GET' && candidate.url === '/api/friendships/5',
        )
        .flush({ succeeded: true, message: null, data: relationship });

      expect(await pending).toEqual({ succeeded: true, data: relationship });
    });

    it('returns a 404 failure when there is no relationship', async () => {
      const pending = friendshipApi.getRelationship(1);
      httpTesting
        .expectOne('/api/friendships/1')
        .flush(
          { succeeded: false, message: 'Relationship not found' },
          { status: 404, statusText: 'Not Found' },
        );

      expect(await pending).toEqual({
        succeeded: false,
        message: 'Relationship not found',
        status: 404,
      });
    });
  });

  describe('POST /api/friendships/{addresseeId}', () => {
    it('sends a request to the user and returns it', async () => {
      const sent: MinimalFriendshipDto = {
        requesterId: 2,
        addresseeId: 5,
        sentAt: '2026-11-18T10:00:00Z',
        status: 'Pending',
      };

      const pending = friendshipApi.sendRequest(5);
      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'POST' && candidate.url === '/api/friendships/5',
      );
      request.flush(
        { succeeded: true, message: null, data: sent },
        { status: 201, statusText: 'Created' },
      );

      expect(await pending).toEqual({ succeeded: true, data: sent });
    });

    it('returns the message when the backend refuses', async () => {
      const pending = friendshipApi.sendRequest(3);
      httpTesting
        .expectOne('/api/friendships/3')
        .flush(
          { succeeded: false, message: 'You are already friends' },
          { status: 400, statusText: 'Bad Request' },
        );

      expect(await pending).toEqual({
        succeeded: false,
        message: 'You are already friends',
        status: 400,
      });
    });
  });

  describe('PUT /api/friendships/{requesterId}/accept and decline', () => {
    const answered: StandardFriendshipDto = {
      otherUser: { id: 4, username: 'charlie' },
      status: 'Accepted',
      sentAt: '2026-11-18T10:00:00Z',
      lastUpdatedAt: '2026-11-18T11:00:00Z',
      isRequester: false,
    };

    it('accepts the request of that user', async () => {
      const pending = friendshipApi.accept(4);
      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'PUT' && candidate.url === '/api/friendships/4/accept',
      );
      request.flush({ succeeded: true, message: null, data: answered });

      expect(await pending).toEqual({ succeeded: true, data: answered });
    });

    it('declines the request of that user', async () => {
      const declined: StandardFriendshipDto = { ...answered, status: 'Declined' };

      const pending = friendshipApi.decline(4);
      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'PUT' && candidate.url === '/api/friendships/4/decline',
      );
      request.flush({ succeeded: true, message: null, data: declined });

      expect(await pending).toEqual({ succeeded: true, data: declined });
    });

    it('returns the message when no request waits', async () => {
      const pending = friendshipApi.accept(1);
      httpTesting
        .expectOne('/api/friendships/1/accept')
        .flush(
          { succeeded: false, message: 'Pending request not found' },
          { status: 400, statusText: 'Bad Request' },
        );

      expect(await pending).toEqual({
        succeeded: false,
        message: 'Pending request not found',
        status: 400,
      });
    });
  });

  describe('DELETE /api/friendships/{userId}', () => {
    it('removes the relationship with the user, whatever its state', async () => {
      const pending = friendshipApi.remove(3);
      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'DELETE' && candidate.url === '/api/friendships/3',
      );
      request.flush({ succeeded: true, message: 'Relationship removed' });

      expect(await pending).toMatchObject({ succeeded: true });
    });

    it('returns a 404 failure when there is nothing to remove', async () => {
      const pending = friendshipApi.remove(1);
      httpTesting
        .expectOne('/api/friendships/1')
        .flush(
          { succeeded: false, message: 'Relationship not found' },
          { status: 404, statusText: 'Not Found' },
        );

      expect(await pending).toEqual({
        succeeded: false,
        message: 'Relationship not found',
        status: 404,
      });
    });
  });

  describe.each([
    { method: 'getFriends', address: '/api/friendships/accepted', status: 'Accepted' },
    { method: 'getSentRequests', address: '/api/friendships/sent', status: 'Pending' },
  ] as const)('GET $address', ({ method, address, status }) => {
    it('sends the page as the query, and returns the rows', async () => {
      const row: StandardFriendshipDto = {
        otherUser: { id: 3, username: 'bob' },
        status,
        sentAt: '2026-11-18T10:00:00Z',
        lastUpdatedAt: null,
        isRequester: true,
      };

      const pending = friendshipApi[method]({ pageNumber: 2, pageSize: 20 });
      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'GET' && candidate.url === address,
      );
      expect(request.request.params.get('pageNumber')).toBe('2');
      expect(request.request.params.get('pageSize')).toBe('20');
      request.flush({ succeeded: true, message: null, data: [row], totalCount: 1 });

      expect(await pending).toEqual({ succeeded: true, data: [row] });
    });

    it('turns a bodiless 401 into a failure', async () => {
      const pending = friendshipApi[method]({ pageNumber: 1, pageSize: 20 });
      httpTesting
        .expectOne(`${address}?pageNumber=1&pageSize=20`)
        .flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(await pending).toMatchObject({ succeeded: false, status: 401 });
    });
  });

  describe('GET /api/friendships/user/{userId}', () => {
    it("sends the page as the query and returns that user's friends", async () => {
      const row: StandardFriendshipDto = {
        otherUser: { id: 3, username: 'bob' },
        status: 'Accepted',
        sentAt: '2026-11-18T10:00:00Z',
        lastUpdatedAt: null,
        isRequester: false,
      };

      const pending = friendshipApi.getFriendsOf(2, { pageNumber: 1, pageSize: 10 });
      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'GET' && candidate.url === '/api/friendships/user/2',
      );
      expect(request.request.params.get('pageNumber')).toBe('1');
      expect(request.request.params.get('pageSize')).toBe('10');
      request.flush({ succeeded: true, message: null, data: [row], totalCount: 1 });

      expect(await pending).toEqual({ succeeded: true, data: [row] });
    });

    it('turns a bodiless 401 into a failure', async () => {
      const pending = friendshipApi.getFriendsOf(2, { pageNumber: 1, pageSize: 10 });
      httpTesting
        .expectOne('/api/friendships/user/2?pageNumber=1&pageSize=10')
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
