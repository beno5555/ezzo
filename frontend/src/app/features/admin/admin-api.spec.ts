import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AccountState } from './account-state';
import { AdminApi } from './admin-api';
import { AdminUserDto } from './admin-user-dto';

const account: AdminUserDto = {
  id: 4,
  username: 'john_doe',
  email: 'john@example.com',
  isAdministrator: false,
  state: AccountState.Deactivated,
  registeredAt: '2026-01-05T10:00:00Z',
  deactivatedAt: '2026-02-01T08:30:00Z',
  deletedAt: null,
};

describe('AdminApi', () => {
  let adminApi: AdminApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    adminApi = TestBed.inject(AdminApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('GET /api/admin/users', () => {
    it('sends only the page when no filter is set, and returns the accounts', async () => {
      const pending = adminApi.getUsers({ pageNumber: 1, pageSize: 10 });

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'GET' && candidate.url === '/api/admin/users',
      );
      expect(request.request.params.keys().sort()).toEqual(['pageNumber', 'pageSize']);
      expect(request.request.params.get('pageNumber')).toBe('1');
      expect(request.request.params.get('pageSize')).toBe('10');
      request.flush({ succeeded: true, message: null, data: [account], totalCount: 1 });

      expect(await pending).toEqual({ succeeded: true, data: [account] });
    });

    it.each(Object.values(AccountState))(
      'sends the state %s as its name, not a number',
      async (state) => {
        const pending = adminApi.getUsers({ pageNumber: 2, pageSize: 10, state });

        const request = httpTesting.expectOne((candidate) => candidate.url === '/api/admin/users');
        expect(request.request.params.get('state')).toBe(state);
        request.flush({ succeeded: true, message: null, data: [], totalCount: 0 });
        await pending;
      },
    );

    it('sends the username filter beside the state', async () => {
      const pending = adminApi.getUsers({
        pageNumber: 1,
        pageSize: 10,
        state: AccountState.Active,
        username: 'doe',
      });

      const request = httpTesting.expectOne((candidate) => candidate.url === '/api/admin/users');
      expect(request.request.params.get('state')).toBe('Active');
      expect(request.request.params.get('username')).toBe('doe');
      request.flush({ succeeded: true, message: null, data: [], totalCount: 0 });
      await pending;
    });

    it('leaves an empty username out of the request', async () => {
      const pending = adminApi.getUsers({ pageNumber: 1, pageSize: 10, username: '' });

      const request = httpTesting.expectOne((candidate) => candidate.url === '/api/admin/users');
      expect(request.request.params.has('username')).toBe(false);
      request.flush({ succeeded: true, message: null, data: [], totalCount: 0 });
      await pending;
    });

    it('answers a non-administrator with the forbidden text', async () => {
      const pending = adminApi.getUsers({ pageNumber: 1, pageSize: 10 });

      httpTesting
        .expectOne((candidate) => candidate.url === '/api/admin/users')
        .flush(null, { status: 403, statusText: 'Forbidden' });

      expect(await pending).toEqual({
        succeeded: false,
        message: 'You are not allowed to do this.',
        status: 403,
      });
    });
  });
});
