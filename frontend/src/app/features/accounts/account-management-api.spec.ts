import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AccountManagementApi } from './account-management-api';

describe('AccountManagementApi', () => {
  let managementApi: AccountManagementApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    managementApi = TestBed.inject(AccountManagementApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('PUT /api/accounts/{id}/assign-administrator', () => {
    it('grants the role to the account with that id', async () => {
      const pending = managementApi.assignAdministrator(4);

      const request = httpTesting.expectOne(
        (candidate) =>
          candidate.method === 'PUT' && candidate.url === '/api/accounts/4/assign-administrator',
      );
      request.flush({
        succeeded: true,
        message: 'Administrator privileges assigned to user',
        data: { userId: 4, roleId: 1 },
      });

      expect((await pending).succeeded).toBe(true);
    });

    it('returns the message when the account already has the role', async () => {
      const pending = managementApi.assignAdministrator(4);

      httpTesting
        .expectOne('/api/accounts/4/assign-administrator')
        .flush(
          { succeeded: false, message: 'Role already assigned' },
          { status: 400, statusText: 'Bad Request' },
        );

      expect(await pending).toEqual({
        succeeded: false,
        message: 'Role already assigned',
        status: 400,
      });
    });
  });

  describe('PUT /api/accounts/{id}/remove-administrator', () => {
    it('removes the role from the account with that id', async () => {
      const pending = managementApi.removeAdministrator(4);

      const request = httpTesting.expectOne(
        (candidate) =>
          candidate.method === 'PUT' && candidate.url === '/api/accounts/4/remove-administrator',
      );
      request.flush({ succeeded: true, message: 'Role unassigned from user' });

      expect((await pending).succeeded).toBe(true);
    });

    it('answers a non-administrator with the forbidden text', async () => {
      const pending = managementApi.removeAdministrator(4);

      httpTesting
        .expectOne('/api/accounts/4/remove-administrator')
        .flush(null, { status: 403, statusText: 'Forbidden' });

      expect(await pending).toEqual({
        succeeded: false,
        message: 'You are not allowed to do this.',
        status: 403,
      });
    });
  });

  describe('DELETE /api/accounts/{id}', () => {
    it('deletes the account with that id', async () => {
      const pending = managementApi.deleteAccount(4);

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'DELETE' && candidate.url === '/api/accounts/4',
      );
      request.flush({ succeeded: true, message: 'Account deleted' });

      expect((await pending).succeeded).toBe(true);
    });

    it('returns the message when the account is already deleted', async () => {
      const pending = managementApi.deleteAccount(4);

      httpTesting
        .expectOne('/api/accounts/4')
        .flush(
          { succeeded: false, message: 'User not found' },
          { status: 400, statusText: 'Bad Request' },
        );

      expect(await pending).toEqual({ succeeded: false, message: 'User not found', status: 400 });
    });
  });

  describe('DELETE /api/accounts/mine', () => {
    it("deletes the signed-in user's own account", async () => {
      const pending = managementApi.deleteOwnAccount();

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'DELETE' && candidate.url === '/api/accounts/mine',
      );
      request.flush({ succeeded: true, message: 'Account deleted' });

      expect((await pending).succeeded).toBe(true);
    });

    it('returns the message when the account is already deleted', async () => {
      const pending = managementApi.deleteOwnAccount();

      httpTesting
        .expectOne('/api/accounts/mine')
        .flush(
          { succeeded: false, message: 'User not found' },
          { status: 400, statusText: 'Bad Request' },
        );

      expect(await pending).toEqual({ succeeded: false, message: 'User not found', status: 400 });
    });
  });
});
