import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MockInstance } from 'vitest';
import { AppResult } from '../../../core/http/app-result';
import { AccountActivationApi } from '../../accounts/account-activation-api';
import { SignInNotice } from '../landing-page/sign-in-notice';
import { ReactivateAccountPage } from './reactivate-account-page';

// Class-level tests: the page is created with a stubbed API, and the tests read its calls and its navigation,
// never its DOM (component DOM tests wait until after the release; conventions, Tests and linting).
describe('ReactivateAccountPage', () => {
  const succeeded: AppResult<void> = { succeeded: true, data: undefined };
  const deadLink: AppResult<void> = { succeeded: false, message: 'User not found', status: 400 };

  let activationApi: {
    requestActivation: ReturnType<typeof vi.fn>;
    activate: ReturnType<typeof vi.fn>;
  };
  let navigateByUrl: MockInstance<Router['navigateByUrl']>;

  beforeEach(() => {
    activationApi = {
      requestActivation: vi.fn().mockResolvedValue(succeeded),
      activate: vi.fn().mockResolvedValue(succeeded),
    };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AccountActivationApi, useValue: activationApi }],
    });
    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function openPage(token?: string): Promise<ReactivateAccountPage> {
    const fixture = TestBed.createComponent(ReactivateAccountPage);
    if (token !== undefined) {
      fixture.componentRef.setInput('token', token);
    }
    await fixture.whenStable();

    return fixture.componentInstance;
  }

  describe('opened without a token', () => {
    it('asks for a link that opens this page', async () => {
      const page = await openPage();
      page['emailForm'].setValue({ email: 'erin@example.com' });

      await page.sendLink();

      expect(activationApi.requestActivation).toHaveBeenCalledWith({
        email: 'erin@example.com',
        redirectUrl: `${document.location.origin}/reactivate-account`,
      });
      expect(page['sentTo']()).toBe('erin@example.com');
    });

    it("keeps the form and shows the backend's message when the request is refused", async () => {
      activationApi.requestActivation.mockResolvedValue({
        succeeded: false,
        message: 'User not found',
        status: 400,
      });
      const page = await openPage();
      page['emailForm'].setValue({ email: 'nobody@example.com' });

      await page.sendLink();

      expect(page['sentTo']()).toBeNull();
      expect(page['requestFailureMessage']()).toBe('User not found');
    });
  });

  describe("opened from the email's link", () => {
    it('does not reactivate on its own', async () => {
      await openPage('the-token');

      expect(activationApi.activate).not.toHaveBeenCalled();
    });

    it('reactivates when the button is pressed, then shows sign-in with the reactivated message', async () => {
      const page = await openPage('the-token');

      await page.reactivate();

      expect(activationApi.activate).toHaveBeenCalledWith('the-token');
      expect(navigateByUrl).toHaveBeenCalledWith('/', {
        state: { notice: SignInNotice.AccountReactivated },
      });
    });

    it("stays on the page with the backend's message when the link is dead", async () => {
      activationApi.activate.mockResolvedValue(deadLink);
      const page = await openPage('used-token');

      await page.reactivate();

      expect(navigateByUrl).not.toHaveBeenCalled();
      expect(page['activationFailureMessage']()).toBe('User not found');
    });
  });
});
