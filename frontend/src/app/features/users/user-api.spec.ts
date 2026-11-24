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
        data: [{ id: 7, username: 'john.doe', relationship: null }],
        totalCount: 1,
      });

      expect(await pending).toEqual({
        succeeded: true,
        message: "Search results for 'john.doe':",
        data: [{ id: 7, username: 'john.doe', relationship: null }],
      });
    });
  });

  describe('POST /api/users', () => {
    const registration = {
      username: 'new_user',
      email: 'new.user@example.com',
      password: 'secret1',
      dateOfBirth: '2000-04-01',
      bio: null,
    };

    it('sends the fields of registration and returns the new account', async () => {
      const created = {
        id: 12,
        username: 'new_user',
        email: 'new.user@example.com',
        bio: null,
        roles: [],
        registeredAt: '2026-11-21T10:00:00Z',
        dateOfBirth: '2000-04-01T00:00:00Z',
        usernameLastChangedAt: null,
      };
      const pending = userApi.create(registration);

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'POST' && candidate.url === '/api/users',
      );
      expect(request.request.body).toEqual(registration);
      request.flush({ succeeded: true, message: 'Registered', data: created });

      expect(await pending).toEqual({ succeeded: true, data: created, message: 'Registered' });
    });

    it('returns the message when the username is taken', async () => {
      const pending = userApi.create(registration);

      httpTesting
        .expectOne('/api/users')
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

    it('returns the field errors of a validation refusal under the DTO field names', async () => {
      const pending = userApi.create(registration);

      httpTesting
        .expectOne('/api/users')
        .flush(
          { errors: { Email: ['The field Email must be a valid email.'] } },
          { status: 400, statusText: 'Bad Request' },
        );

      expect(await pending).toEqual({
        succeeded: false,
        message: 'Some fields are not valid.',
        status: 400,
        fieldErrors: { email: ['The field Email must be a valid email.'] },
      });
    });
  });

  describe('PUT /api/users/{id}', () => {
    const profile = { username: 'john_doe', dateOfBirth: '2000-04-01', bio: 'Hello' };

    it('sends the profile fields to the account with that id and returns the stored account', async () => {
      const stored = {
        id: 7,
        username: 'john_doe',
        email: 'john@example.com',
        bio: 'Hello',
        roles: [],
        registeredAt: '2026-01-05T10:00:00Z',
        dateOfBirth: '2000-04-01T00:00:00Z',
        usernameLastChangedAt: null,
      };
      const pending = userApi.edit(7, profile);

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'PUT' && candidate.url === '/api/users/7',
      );
      expect(request.request.body).toEqual(profile);
      request.flush({ succeeded: true, message: 'Profile edited', data: stored });

      expect(await pending).toEqual({ succeeded: true, data: stored, message: 'Profile edited' });
    });

    it('returns the message when the username can not be changed yet', async () => {
      const pending = userApi.edit(7, profile);

      httpTesting
        .expectOne('/api/users/7')
        .flush(
          { succeeded: false, message: 'Username can be changed again on 2026-12-01' },
          { status: 400, statusText: 'Bad Request' },
        );

      expect(await pending).toEqual({
        succeeded: false,
        message: 'Username can be changed again on 2026-12-01',
        status: 400,
      });
    });
  });

  describe('GET /api/users/{username}', () => {
    it('returns the user with that username', async () => {
      const user = { id: 7, username: 'john_doe', bio: null, dateOfBirth: '2000-04-01T00:00:00Z' };
      const pending = userApi.getByUsername('john_doe');

      httpTesting
        .expectOne(
          (candidate) => candidate.method === 'GET' && candidate.url === '/api/users/john_doe',
        )
        .flush({ succeeded: true, message: null, data: user });

      expect(await pending).toEqual({ succeeded: true, data: user });
    });

    it('sends the username as one segment of the address', async () => {
      const pending = userApi.getByUsername('a/b?c');

      httpTesting
        .expectOne('/api/users/a%2Fb%3Fc')
        .flush({ succeeded: true, message: null, data: null });

      await pending;
    });

    it('returns the message when there is no such user', async () => {
      const pending = userApi.getByUsername('nobody');

      httpTesting
        .expectOne('/api/users/nobody')
        .flush(
          { succeeded: false, message: 'User not found' },
          { status: 404, statusText: 'Not Found' },
        );

      expect(await pending).toEqual({ succeeded: false, message: 'User not found', status: 404 });
    });
  });

  describe('GET /api/users/mine', () => {
    it("returns the signed-in user's own profile", async () => {
      const profile = {
        id: 7,
        username: 'john_doe',
        email: 'john@example.com',
        bio: null,
        roles: ['User'],
        registeredAt: '2026-01-05T09:30:00Z',
        dateOfBirth: '2000-04-01T00:00:00Z',
        usernameLastChangedAt: null,
      };
      const pending = userApi.getMine();

      httpTesting
        .expectOne((candidate) => candidate.method === 'GET' && candidate.url === '/api/users/mine')
        .flush({ succeeded: true, message: null, data: profile });

      expect(await pending).toEqual({ succeeded: true, data: profile });
    });

    it('answers a signed-out caller with the sign-in text', async () => {
      const pending = userApi.getMine();

      httpTesting
        .expectOne('/api/users/mine')
        .flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(await pending).toEqual({
        succeeded: false,
        message: 'Please sign in to continue.',
        status: 401,
      });
    });
  });

  describe('PUT /api/users/mine', () => {
    const profile = { username: 'john_doe', dateOfBirth: '2000-04-01', bio: 'Hello' };

    it('sends the profile and returns the stored one', async () => {
      const stored = { id: 7, ...profile, usernameLastChangedAt: '2026-11-20T10:00:00Z' };
      const pending = userApi.editMine(profile);

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'PUT' && candidate.url === '/api/users/mine',
      );
      request.flush({ succeeded: true, message: 'Profile updated', data: stored });

      expect(request.request.body).toEqual(profile);
      expect(await pending).toEqual({ succeeded: true, message: 'Profile updated', data: stored });
    });

    it('returns the message when the username changed again inside the cooldown', async () => {
      const pending = userApi.editMine(profile);

      httpTesting
        .expectOne('/api/users/mine')
        .flush(
          { succeeded: false, message: 'Username can be changed again on 2026-12-01' },
          { status: 400, statusText: 'Bad Request' },
        );

      expect(await pending).toEqual({
        succeeded: false,
        message: 'Username can be changed again on 2026-12-01',
        status: 400,
      });
    });
  });
});
