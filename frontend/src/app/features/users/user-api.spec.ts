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
