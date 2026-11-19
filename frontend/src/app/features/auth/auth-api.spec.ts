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

  describe('POST /api/auth/register', () => {
    const registration = {
      username: 'new_user',
      email: 'new_user@example.com',
      password: 'password123',
      dateOfBirth: '2000-05-17',
      bio: null,
    };

    it('sends the new account and succeeds on the created answer', async () => {
      const pending = authApi.register(registration);

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'POST' && candidate.url === '/api/auth/register',
      );
      expect(request.request.body).toEqual(registration);
      request.flush(
        { succeeded: true, message: 'Registration successful', data: { id: 7 } },
        { status: 201, statusText: 'Created' },
      );

      expect((await pending).succeeded).toBe(true);
    });

    it('returns the message for a username that is taken', async () => {
      const pending = authApi.register(registration);

      httpTesting
        .expectOne('/api/auth/register')
        .flush(
          { succeeded: false, message: 'Username is already taken' },
          { status: 400, statusText: 'Bad Request' },
        );

      expect(await pending).toEqual({
        succeeded: false,
        message: 'Username is already taken',
        status: 400,
      });
    });
  });

  describe('PUT /api/auth/request-password-reset', () => {
    it('sends the email and the address the link leads to', async () => {
      const pending = authApi.requestPasswordReset({
        email: 'john@example.com',
        redirectUrl: 'http://localhost:4200/reset-password',
      });

      const request = httpTesting.expectOne(
        (candidate) =>
          candidate.method === 'PUT' && candidate.url === '/api/auth/request-password-reset',
      );
      expect(request.request.body).toEqual({
        email: 'john@example.com',
        redirectUrl: 'http://localhost:4200/reset-password',
      });
      request.flush({ succeeded: true, message: 'Password reset requested' });

      expect(await pending).toEqual({
        succeeded: true,
        message: 'Password reset requested',
        data: undefined,
      });
    });
  });

  describe('PUT /api/auth/reset-password', () => {
    it('sends the token and the new password', async () => {
      const pending = authApi.resetPassword({ token: 'the-token', newPassword: 'new-pass1' });

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'PUT' && candidate.url === '/api/auth/reset-password',
      );
      expect(request.request.body).toEqual({ token: 'the-token', newPassword: 'new-pass1' });
      request.flush({ succeeded: true, message: 'Password changed' });

      expect((await pending).succeeded).toBe(true);
    });

    it('returns the message for a token that is no longer valid', async () => {
      const pending = authApi.resetPassword({ token: 'old-token', newPassword: 'new-pass1' });

      httpTesting
        .expectOne('/api/auth/reset-password')
        .flush(
          { succeeded: false, message: 'Invalid or expired token' },
          { status: 400, statusText: 'Bad Request' },
        );

      expect(await pending).toEqual({
        succeeded: false,
        message: 'Invalid or expired token',
        status: 400,
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
