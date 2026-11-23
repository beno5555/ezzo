import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MockInstance } from 'vitest';
import { AppResult } from '../../../core/http/app-result';
import { SessionStore } from '../../../core/session/session-store';
import { ConfirmationOpener } from '../../../shared/confirmation/confirmation-opener';
import { ToastStore } from '../../../shared/toasts/toast-store';
import { AccountActivationApi } from '../../accounts/account-activation-api';
import { AccountManagementApi } from '../../accounts/account-management-api';
import { SignInNotice } from '../../auth/landing-page/sign-in-notice';
import { DangerZone } from './danger-zone';

// Class-level tests: the component is created with stubbed collaborators, and the tests read their calls
// and the navigation, never the DOM (conventions, Tests and linting).
describe('DangerZone', () => {
  const succeeded: AppResult<void> = { succeeded: true, data: undefined };

  let activationApi: { deactivateOwnAccount: ReturnType<typeof vi.fn> };
  let managementApi: { deleteOwnAccount: ReturnType<typeof vi.fn> };
  let confirmationOpener: { ask: ReturnType<typeof vi.fn> };
  let sessionStore: { signOut: ReturnType<typeof vi.fn> };
  let navigateByUrl: MockInstance<Router['navigateByUrl']>;

  beforeEach(() => {
    activationApi = { deactivateOwnAccount: vi.fn().mockResolvedValue(succeeded) };
    managementApi = { deleteOwnAccount: vi.fn().mockResolvedValue(succeeded) };
    confirmationOpener = { ask: vi.fn().mockResolvedValue(true) };
    sessionStore = { signOut: vi.fn().mockResolvedValue(undefined) };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AccountActivationApi, useValue: activationApi },
        { provide: AccountManagementApi, useValue: managementApi },
        { provide: ConfirmationOpener, useValue: confirmationOpener },
        { provide: SessionStore, useValue: sessionStore },
      ],
    });
    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function openZone(): Promise<DangerZone> {
    const fixture = TestBed.createComponent(DangerZone);
    fixture.componentRef.setInput('username', 'john_doe');
    await fixture.whenStable();

    return fixture.componentInstance;
  }

  describe('deactivating the account', () => {
    it('asks for the username to be typed', async () => {
      const zone = await openZone();

      await zone.deactivate();

      expect(confirmationOpener.ask).toHaveBeenCalledWith(
        expect.objectContaining({ typedWord: 'john_doe', isDestructive: true }),
      );
    });

    it('signs out and shows the reactivation notice once the backend has done it', async () => {
      const zone = await openZone();

      await zone.deactivate();

      expect(activationApi.deactivateOwnAccount).toHaveBeenCalledTimes(1);
      expect(sessionStore.signOut).toHaveBeenCalledTimes(1);
      expect(navigateByUrl).toHaveBeenCalledWith('/', {
        state: { notice: SignInNotice.AccountDeactivated },
      });
    });

    it('does nothing when the confirmation is declined', async () => {
      confirmationOpener.ask.mockResolvedValue(false);
      const zone = await openZone();

      await zone.deactivate();

      expect(activationApi.deactivateOwnAccount).not.toHaveBeenCalled();
      expect(sessionStore.signOut).not.toHaveBeenCalled();
      expect(navigateByUrl).not.toHaveBeenCalled();
    });

    it("keeps the user signed in and toasts the server's refusal", async () => {
      activationApi.deactivateOwnAccount.mockResolvedValue({
        succeeded: false,
        message: 'User not found',
        status: 400,
      });
      const zone = await openZone();

      await zone.deactivate();

      expect(sessionStore.signOut).not.toHaveBeenCalled();
      expect(navigateByUrl).not.toHaveBeenCalled();
      expect(
        TestBed.inject(ToastStore)
          .visible()
          .map((toast) => toast.message),
      ).toEqual(['User not found']);
      expect(zone['isBusy']()).toBe(false);
    });
  });

  describe('deleting the account', () => {
    it('asks for the username to be typed', async () => {
      const zone = await openZone();

      await zone.deleteAccount();

      expect(confirmationOpener.ask).toHaveBeenCalledWith(
        expect.objectContaining({ typedWord: 'john_doe', isDestructive: true }),
      );
    });

    it('signs out and shows the retention notice once the backend has done it', async () => {
      const zone = await openZone();

      await zone.deleteAccount();

      expect(managementApi.deleteOwnAccount).toHaveBeenCalledTimes(1);
      expect(sessionStore.signOut).toHaveBeenCalledTimes(1);
      expect(navigateByUrl).toHaveBeenCalledWith('/', {
        state: { notice: SignInNotice.AccountDeleted },
      });
    });

    it('does nothing when the confirmation is declined', async () => {
      confirmationOpener.ask.mockResolvedValue(false);
      const zone = await openZone();

      await zone.deleteAccount();

      expect(managementApi.deleteOwnAccount).not.toHaveBeenCalled();
      expect(sessionStore.signOut).not.toHaveBeenCalled();
    });

    it("keeps the user signed in and toasts the server's refusal", async () => {
      managementApi.deleteOwnAccount.mockResolvedValue({
        succeeded: false,
        message: 'User not found',
        status: 400,
      });
      const zone = await openZone();

      await zone.deleteAccount();

      expect(sessionStore.signOut).not.toHaveBeenCalled();
      expect(TestBed.inject(ToastStore).visible()).toHaveLength(1);
    });
  });
});
