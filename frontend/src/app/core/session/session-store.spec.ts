import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SessionStore } from './session-store';
import { createAccessToken } from './testing/create-access-token';
import { FakeLockManager, installFakeLockManager } from './testing/fake-lock-manager';
import { waitForPendingWork } from './testing/wait-for-pending-work';

const userToken = createAccessToken({
  nameid: '12',
  unique_name: 'john_doe',
  role: 'User',
  exp: 1900000000,
});
const administratorToken = createAccessToken({
  nameid: '1',
  unique_name: 'sandro_beno',
  role: ['User', 'Administrator'],
  exp: 1900000000,
});

describe('SessionStore', () => {
  let sessionStore: SessionStore;
  let httpTesting: HttpTestingController;
  let lockManager: FakeLockManager;

  beforeEach(() => {
    lockManager = installFakeLockManager();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    sessionStore = TestBed.inject(SessionStore);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  async function restoreWith(accessToken: string): Promise<void> {
    const restoring = sessionStore.restore();
    await waitForPendingWork();
    httpTesting.expectOne('/api/auth/refresh').flush({ accessToken });
    await restoring;
  }

  describe('restore', () => {
    it('signs the user in from the refresh cookie', async () => {
      await restoreWith(userToken);

      expect(sessionStore.isSignedIn()).toBe(true);
      expect(sessionStore.user()).toEqual({ id: 12, username: 'john_doe', roles: ['User'] });
      expect(sessionStore.accessToken()).toBe(userToken);
      expect(sessionStore.isAdministrator()).toBe(false);
    });

    it('stays signed out when the refresh fails', async () => {
      const restoring = sessionStore.restore();
      await waitForPendingWork();
      httpTesting
        .expectOne('/api/auth/refresh')
        .flush(
          { succeeded: false, message: 'No refresh token provided' },
          { status: 401, statusText: 'Unauthorized' },
        );
      await restoring;

      expect(sessionStore.isSignedIn()).toBe(false);
      expect(sessionStore.user()).toBeNull();
      expect(sessionStore.accessToken()).toBeNull();
    });

    it('waits for another tab to finish its turn before refreshing', async () => {
      const releaseOtherTab = lockManager.holdAsAnotherTab();

      const restoring = sessionStore.restore();
      await waitForPendingWork();
      httpTesting.expectNone('/api/auth/refresh');

      releaseOtherTab();
      await waitForPendingWork();
      httpTesting.expectOne('/api/auth/refresh').flush({ accessToken: userToken });
      await restoring;

      expect(sessionStore.isSignedIn()).toBe(true);
    });
  });

  describe('signIn', () => {
    it('starts the session from the token login returns', async () => {
      const signingIn = sessionStore.signIn({
        uniqueIdentifier: 'sandro_beno',
        password: 'pw1234',
      });
      await waitForPendingWork();
      httpTesting.expectOne('/api/auth/login').flush({ accessToken: administratorToken });
      const result = await signingIn;

      expect(result.succeeded).toBe(true);
      expect(sessionStore.user()?.username).toBe('sandro_beno');
      expect(sessionStore.isAdministrator()).toBe(true);
    });

    it('stays signed out and returns the message on wrong credentials', async () => {
      const signingIn = sessionStore.signIn({ uniqueIdentifier: 'john_doe', password: 'wrong1' });
      await waitForPendingWork();
      httpTesting
        .expectOne('/api/auth/login')
        .flush(
          { succeeded: false, message: 'Invalid username or password' },
          { status: 400, statusText: 'Bad Request' },
        );
      const result = await signingIn;

      expect(result).toEqual({
        succeeded: false,
        message: 'Invalid username or password',
        status: 400,
      });
      expect(sessionStore.isSignedIn()).toBe(false);
    });
  });

  describe('signOut', () => {
    it('revokes the refresh cookie and clears the session', async () => {
      await restoreWith(userToken);

      const signingOut = sessionStore.signOut();
      await waitForPendingWork();
      httpTesting.expectOne('/api/auth/logout').flush(null);
      await signingOut;

      expect(sessionStore.isSignedIn()).toBe(false);
      expect(sessionStore.accessToken()).toBeNull();
    });
  });

  it('never writes the token to localStorage or sessionStorage', async () => {
    await restoreWith(userToken);

    const storedValues = [
      ...Object.values({ ...localStorage }),
      ...Object.values({ ...sessionStorage }),
    ];
    expect(storedValues).not.toContain(userToken);
  });
});
