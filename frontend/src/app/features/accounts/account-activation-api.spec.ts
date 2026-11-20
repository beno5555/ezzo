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
});
