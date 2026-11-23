import { TestBed } from '@angular/core/testing';
import { AppResult } from '../../../core/http/app-result';
import { ToastStore } from '../../../shared/toasts/toast-store';
import { AuthApi } from '../../auth/auth-api';
import { PasswordSettings } from './password-settings';

// Class-level tests: the component is created with a stubbed API, and the tests read its calls and its
// state, never the DOM (conventions, Tests and linting).
describe('PasswordSettings', () => {
  const succeeded: AppResult<void> = { succeeded: true, data: undefined };

  let authApi: { requestPasswordReset: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authApi = { requestPasswordReset: vi.fn().mockResolvedValue(succeeded) };
    TestBed.configureTestingModule({ providers: [{ provide: AuthApi, useValue: authApi }] });
  });

  async function openSettings(): Promise<PasswordSettings> {
    const fixture = TestBed.createComponent(PasswordSettings);
    fixture.componentRef.setInput('email', 'john@example.com');
    await fixture.whenStable();

    return fixture.componentInstance;
  }

  it("asks for a reset email to the user's own address, with a link to this app's reset page", async () => {
    const settings = await openSettings();

    await settings.sendLink();

    expect(authApi.requestPasswordReset).toHaveBeenCalledWith({
      email: 'john@example.com',
      redirectUrl: `${document.location.origin}/reset-password`,
    });
    expect(settings['sentTo']()).toBe('john@example.com');
  });

  it('says nothing is sent before the button is pressed', async () => {
    const settings = await openSettings();

    expect(authApi.requestPasswordReset).not.toHaveBeenCalled();
    expect(settings['sentTo']()).toBeNull();
  });

  it("toasts the server's message when the request is refused", async () => {
    authApi.requestPasswordReset.mockResolvedValue({
      succeeded: false,
      message: 'Too many requests',
      status: 429,
    });
    const settings = await openSettings();

    await settings.sendLink();

    expect(settings['sentTo']()).toBeNull();
    expect(
      TestBed.inject(ToastStore)
        .visible()
        .map((toast) => toast.message),
    ).toEqual(['Too many requests']);
    expect(settings['isSending']()).toBe(false);
  });
});
