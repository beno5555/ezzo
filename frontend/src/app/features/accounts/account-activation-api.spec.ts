import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AccountActivationApi } from './account-activation-api';

describe('AccountActivationApi', () => {
  let activationApi: AccountActivationApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    activationApi = TestBed.inject(AccountActivationApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('PATCH /api/accounts/request-activate', () => {
    it('sends the email of the deactivated account and the page the link opens', async () => {
      const pending = activationApi.requestActivation({
        email: 'john@example.com',
        redirectUrl: 'http://localhost:4200/reactivate-account',
      });

      const request = httpTesting.expectOne(
        (candidate) =>
          candidate.method === 'PATCH' && candidate.url === '/api/accounts/request-activate',
      );
      expect(request.request.body).toEqual({
        email: 'john@example.com',
        redirectUrl: 'http://localhost:4200/reactivate-account',
      });
      request.flush({ succeeded: true, message: 'Activation token sent to your email' });

      expect((await pending).succeeded).toBe(true);
    });

    it('returns the message when no deactivated account has the email', async () => {
      const pending = activationApi.requestActivation({
        email: 'nobody@example.com',
        redirectUrl: 'http://localhost:4200/reactivate-account',
      });

      httpTesting
        .expectOne('/api/accounts/request-activate')
        .flush(
          { succeeded: false, message: 'User not found' },
          { status: 400, statusText: 'Bad Request' },
        );

      expect(await pending).toEqual({ succeeded: false, message: 'User not found', status: 400 });
    });
  });

  describe('PATCH /api/accounts/activate', () => {
    it("sends the token from the email's link as the activation token", async () => {
      const pending = activationApi.activate('the-token');

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'PATCH' && candidate.url === '/api/accounts/activate',
      );
      expect(request.request.body).toEqual({ activationToken: 'the-token' });
      request.flush({ succeeded: true, message: 'Account activated', data: { id: 3 } });

      expect((await pending).succeeded).toBe(true);
    });
  });

  describe('PATCH /api/accounts/{id}/deactivate', () => {
    it('deactivates the account with that id', async () => {
      const pending = activationApi.deactivateAccount(4);

      const request = httpTesting.expectOne(
        (candidate) =>
          candidate.method === 'PATCH' && candidate.url === '/api/accounts/4/deactivate',
      );
      request.flush({ succeeded: true, message: 'Account deactivated' });

      expect((await pending).succeeded).toBe(true);
    });

    it('returns the message when there is no such active account', async () => {
      const pending = activationApi.deactivateAccount(99);

      httpTesting
        .expectOne('/api/accounts/99/deactivate')
        .flush(
          { succeeded: false, message: 'User not found' },
          { status: 404, statusText: 'Not Found' },
        );

      expect(await pending).toEqual({ succeeded: false, message: 'User not found', status: 404 });
    });
  });

  describe('PATCH /api/accounts/{id}/activate', () => {
    it('reactivates the account with that id', async () => {
      const pending = activationApi.reactivateAccount(4);

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'PATCH' && candidate.url === '/api/accounts/4/activate',
      );
      request.flush({ succeeded: true, message: 'Account activated', data: { id: 4 } });

      expect((await pending).succeeded).toBe(true);
    });

    it('returns the message when the account is not deactivated', async () => {
      const pending = activationApi.reactivateAccount(4);

      httpTesting
        .expectOne('/api/accounts/4/activate')
        .flush(
          { succeeded: false, message: 'User not found' },
          { status: 400, statusText: 'Bad Request' },
        );

      expect(await pending).toEqual({ succeeded: false, message: 'User not found', status: 400 });
    });
  });

  describe('PATCH /api/accounts/mine/deactivate', () => {
    it("deactivates the signed-in user's own account", async () => {
      const pending = activationApi.deactivateOwnAccount();

      const request = httpTesting.expectOne(
        (candidate) =>
          candidate.method === 'PATCH' && candidate.url === '/api/accounts/mine/deactivate',
      );
      request.flush({ succeeded: true, message: 'Account deactivated' });

      expect((await pending).succeeded).toBe(true);
    });

    it('returns the message when the account cannot be deactivated', async () => {
      const pending = activationApi.deactivateOwnAccount();

      httpTesting
        .expectOne('/api/accounts/mine/deactivate')
        .flush(
          { succeeded: false, message: 'User not found' },
          { status: 400, statusText: 'Bad Request' },
        );

      expect(await pending).toEqual({ succeeded: false, message: 'User not found', status: 400 });
    });
  });
});
