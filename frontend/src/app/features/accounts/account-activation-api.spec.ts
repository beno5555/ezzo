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
    it('sends the email of the deactivated account', async () => {
      const pending = activationApi.requestActivation('john@example.com');

      const request = httpTesting.expectOne(
        (candidate) =>
          candidate.method === 'PATCH' && candidate.url === '/api/accounts/request-activate',
      );
      expect(request.request.body).toEqual({ email: 'john@example.com' });
      request.flush({ succeeded: true, message: 'Activation token sent to your email' });

      expect((await pending).succeeded).toBe(true);
    });

    it('returns the message when no deactivated account has the email', async () => {
      const pending = activationApi.requestActivation('nobody@example.com');

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
    it('sends the code from the email as the activation token', async () => {
      const pending = activationApi.activate('the-code');

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'PATCH' && candidate.url === '/api/accounts/activate',
      );
      expect(request.request.body).toEqual({ activationToken: 'the-code' });
      request.flush({ succeeded: true, message: 'Account activated', data: { id: 3 } });

      expect((await pending).succeeded).toBe(true);
    });
  });
});
