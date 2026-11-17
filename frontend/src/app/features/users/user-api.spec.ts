import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UserApi } from './user-api';

describe('UserApi', () => {
  let userApi: UserApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    userApi = TestBed.inject(UserApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('GET /api/users/{id}', () => {
    it('returns the user with that id', async () => {
      const user = { id: 7, username: 'john_doe', bio: null, dateOfBirth: '2000-04-01T00:00:00Z' };
      const pending = userApi.getById(7);

      httpTesting
        .expectOne((candidate) => candidate.method === 'GET' && candidate.url === '/api/users/7')
        .flush({ succeeded: true, message: null, data: user });

      expect(await pending).toEqual({ succeeded: true, data: user });
    });

    it('returns the message when there is no such user', async () => {
      const pending = userApi.getById(99);

      httpTesting
        .expectOne('/api/users/99')
        .flush(
          { succeeded: false, message: 'User not found' },
          { status: 404, statusText: 'Not Found' },
        );

      expect(await pending).toEqual({ succeeded: false, message: 'User not found', status: 404 });
    });
  });

  describe('GET /api/users/search', () => {
    it('sends the username and the page as the query, and returns the users found', async () => {
      const pending = userApi.searchUsers({ username: 'john.doe', pageNumber: 2, pageSize: 20 });

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'GET' && candidate.url === '/api/users/search',
      );
      expect(request.request.params.get('username')).toBe('john.doe');
      expect(request.request.params.get('pageNumber')).toBe('2');
      expect(request.request.params.get('pageSize')).toBe('20');
      request.flush({
        succeeded: true,
        message: "Search results for 'john.doe':",
        data: [{ id: 7, username: 'john.doe' }],
        totalCount: 1,
      });

      expect(await pending).toEqual({
        succeeded: true,
        message: "Search results for 'john.doe':",
        data: [{ id: 7, username: 'john.doe' }],
      });
    });
  });
});
