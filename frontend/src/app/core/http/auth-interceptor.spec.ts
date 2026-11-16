import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../../features/auth/auth-api';
import { SessionStore } from '../session/session-store';
import { createAccessToken } from '../session/testing/create-access-token';
import { installFakeLockManager } from '../session/testing/fake-lock-manager';
import { waitForPendingWork } from '../session/testing/wait-for-pending-work';
import { authInterceptor } from './auth-interceptor';

const firstToken = createAccessToken({ nameid: '12', unique_name: 'john_doe', exp: 1900000000 });
const secondToken = createAccessToken({ nameid: '12', unique_name: 'john_doe', exp: 1900000900 });
const unauthorized = { status: 401, statusText: 'Unauthorized' };
const refreshFailure = { succeeded: false, message: 'Invalid refresh token' };

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let sessionStore: SessionStore;
  let router: Router;

  beforeEach(async () => {
    installFakeLockManager();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    sessionStore = TestBed.inject(SessionStore);
    router = TestBed.inject(Router);

    const restoring = sessionStore.restore();
    await waitForPendingWork();
    httpTesting.expectOne('/api/auth/refresh').flush({ accessToken: firstToken });
    await restoring;
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('adds the access token to /api calls', async () => {
    const response = firstValueFrom(http.get('/api/posts/feed'));

    const request = httpTesting.expectOne('/api/posts/feed');
    expect(request.request.headers.get('Authorization')).toBe(`Bearer ${firstToken}`);
    request.flush([]);

    expect(await response).toEqual([]);
  });

  it('adds no token to calls outside /api', async () => {
    const response = firstValueFrom(http.get('/assets/logo.svg', { responseType: 'text' }));

    const request = httpTesting.expectOne('/assets/logo.svg');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush('<svg />');

    expect(await response).toBe('<svg />');
  });

  it('answers a 401 with one refresh and one retry with the new token', async () => {
    const response = firstValueFrom(http.get('/api/posts/feed'));

    httpTesting.expectOne('/api/posts/feed').flush(null, unauthorized);
    await waitForPendingWork();
    httpTesting.expectOne('/api/auth/refresh').flush({ accessToken: secondToken });
    await waitForPendingWork();
    const retry = httpTesting.expectOne('/api/posts/feed');
    expect(retry.request.headers.get('Authorization')).toBe(`Bearer ${secondToken}`);
    retry.flush(['a post']);

    expect(await response).toEqual(['a post']);
  });

  it('does not refresh again when the retry is also rejected', async () => {
    const response = firstValueFrom(http.get('/api/posts/feed'));
    const rejection = expect(response).rejects.toMatchObject({ status: 401 });

    httpTesting.expectOne('/api/posts/feed').flush(null, unauthorized);
    await waitForPendingWork();
    httpTesting.expectOne('/api/auth/refresh').flush({ accessToken: secondToken });
    await waitForPendingWork();
    httpTesting.expectOne('/api/posts/feed').flush(null, unauthorized);
    await waitForPendingWork();

    await rejection;
    httpTesting.expectNone('/api/auth/refresh');
  });

  it('shares one refresh between two simultaneous 401s', async () => {
    const feed = firstValueFrom(http.get('/api/posts/feed'));
    const friends = firstValueFrom(http.get('/api/friendships/mine'));

    httpTesting.expectOne('/api/posts/feed').flush(null, unauthorized);
    httpTesting.expectOne('/api/friendships/mine').flush(null, unauthorized);
    await waitForPendingWork();
    httpTesting.expectOne('/api/auth/refresh').flush({ accessToken: secondToken });
    await waitForPendingWork();
    httpTesting.expectOne('/api/posts/feed').flush(['a post']);
    httpTesting.expectOne('/api/friendships/mine').flush(['a friend']);

    expect(await feed).toEqual(['a post']);
    expect(await friends).toEqual(['a friend']);
  });

  it('retries without refreshing when a refresh finished after the call was sent', async () => {
    const feed = firstValueFrom(http.get('/api/posts/feed'));
    const friends = firstValueFrom(http.get('/api/friendships/mine'));

    httpTesting.expectOne('/api/posts/feed').flush(null, unauthorized);
    await waitForPendingWork();
    httpTesting.expectOne('/api/auth/refresh').flush({ accessToken: secondToken });
    await waitForPendingWork();
    httpTesting.expectOne('/api/posts/feed').flush(['a post']);
    httpTesting.expectOne('/api/friendships/mine').flush(null, unauthorized);
    await waitForPendingWork();
    const retry = httpTesting.expectOne('/api/friendships/mine');
    expect(retry.request.headers.get('Authorization')).toBe(`Bearer ${secondToken}`);
    retry.flush(['a friend']);

    expect(await feed).toEqual(['a post']);
    expect(await friends).toEqual(['a friend']);
  });

  it('clears the session and goes to sign-in, with the wanted address, when the refresh fails', async () => {
    const navigation = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const response = firstValueFrom(http.get('/api/posts/feed'));
    const rejection = expect(response).rejects.toMatchObject({ status: 401 });

    httpTesting.expectOne('/api/posts/feed').flush(null, unauthorized);
    await waitForPendingWork();
    httpTesting.expectOne('/api/auth/refresh').flush(refreshFailure, unauthorized);
    await waitForPendingWork();

    await rejection;
    expect(sessionStore.isSignedIn()).toBe(false);
    expect(navigation).toHaveBeenCalledTimes(1);
    const target = navigation.mock.calls[0][0] as UrlTree;
    expect(router.serializeUrl(target)).toBe('/sign-in?returnUrl=%2F');
  });

  it('never retries sign-in', async () => {
    const authApi = TestBed.inject(AuthApi);
    const signingIn = authApi.signIn({ uniqueIdentifier: 'john_doe', password: 'password123' });

    httpTesting.expectOne('/api/auth/login').flush(refreshFailure, unauthorized);

    expect((await signingIn).succeeded).toBe(false);
    await waitForPendingWork();
    httpTesting.expectNone('/api/auth/refresh');
  });

  it('never retries a refresh', async () => {
    const authApi = TestBed.inject(AuthApi);
    const refreshing = authApi.refresh();

    httpTesting.expectOne('/api/auth/refresh').flush(refreshFailure, unauthorized);

    expect((await refreshing).succeeded).toBe(false);
    await waitForPendingWork();
    httpTesting.expectNone('/api/auth/refresh');
  });

  it('never retries sign-out, which holds the refresh cookie lock', async () => {
    const signingOut = sessionStore.signOut();
    await waitForPendingWork();

    httpTesting.expectOne('/api/auth/logout').flush(refreshFailure, unauthorized);
    await waitForPendingWork();

    expect(sessionStore.isSignedIn()).toBe(false);
    httpTesting.expectNone('/api/auth/refresh');
    await signingOut;
  });
});
