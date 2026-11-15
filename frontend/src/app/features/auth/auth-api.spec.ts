import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthApi } from './auth-api';

describe('AuthApi', () => {
  let authApi: AuthApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    authApi = TestBed.inject(AuthApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('POST /api/auth/login', () => {
    it('sends the username or email and the password, and returns the access token', async () => {
      const pending = authApi.signIn({ uniqueIdentifier: 'john_doe', password: 'password123' });

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'POST' && candidate.url === '/api/auth/login',
      );
      expect(request.request.body).toEqual({
        uniqueIdentifier: 'john_doe',
        password: 'password123',
      });
      request.flush({ accessToken: 'the-token' });

      expect(await pending).toEqual({ succeeded: true, data: { accessToken: 'the-token' } });
    });

    it('returns the failure message for wrong credentials', async () => {
      const pending = authApi.signIn({ uniqueIdentifier: 'john_doe', password: 'wrong-one' });

      httpTesting
        .expectOne('/api/auth/login')
        .flush(
          { succeeded: false, message: 'Invalid username or password' },
          { status: 400, statusText: 'Bad Request' },
        );

      expect(await pending).toEqual({
        succeeded: false,
        message: 'Invalid username or password',
        status: 400,
      });
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('sends no body and returns the new access token', async () => {
      const pending = authApi.refresh();

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'POST' && candidate.url === '/api/auth/refresh',
      );
      expect(request.request.body).toBeNull();
      request.flush({ accessToken: 'the-new-token' });

      expect(await pending).toEqual({ succeeded: true, data: { accessToken: 'the-new-token' } });
    });

    it('returns a failure with status 401 when the cookie is missing', async () => {
      const pending = authApi.refresh();

      httpTesting
        .expectOne('/api/auth/refresh')
        .flush(
          { succeeded: false, message: 'No refresh token provided' },
          { status: 401, statusText: 'Unauthorized' },
        );

      expect(await pending).toEqual({
        succeeded: false,
        message: 'No refresh token provided',
        status: 401,
      });
    });
  });

  describe('PATCH /api/auth/logout', () => {
    it('sends no body and succeeds on the empty answer', async () => {
      const pending = authApi.signOut();

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'PATCH' && candidate.url === '/api/auth/logout',
      );
      expect(request.request.body).toBeNull();
      request.flush(null);

      expect((await pending).succeeded).toBe(true);
    });
  });
});
