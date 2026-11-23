import { TestBed } from '@angular/core/testing';
import { AppResult } from '../../../core/http/app-result';
import { SessionStore } from '../../../core/session/session-store';
import { serverErrorKey } from '../../../shared/form-field/field-error-message';
import { ToastStore } from '../../../shared/toasts/toast-store';
import { FullUserDto } from '../full-user-dto';
import { UserApi } from '../user-api';
import { ProfileSettings } from './profile-settings';

// Class-level tests: the component is created with a stubbed API, and the tests read its calls, its
// outputs and its form, never its DOM (conventions, Tests and linting).
describe('ProfileSettings', () => {
  const profile: FullUserDto = {
    id: 7,
    username: 'john_doe',
    email: 'john@example.com',
    bio: 'Hello',
    roles: ['User'],
    registeredAt: '2026-01-05T09:30:00Z',
    dateOfBirth: '2000-04-01T00:00:00Z',
    usernameLastChangedAt: null,
  };

  let userApi: { editMine: ReturnType<typeof vi.fn> };
  let sessionStore: { refresh: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    userApi = { editMine: vi.fn() };
    sessionStore = { refresh: vi.fn().mockResolvedValue(true) };
    TestBed.configureTestingModule({
      providers: [
        { provide: UserApi, useValue: userApi },
        { provide: SessionStore, useValue: sessionStore },
      ],
    });
  });

  async function openSettings(shown: FullUserDto = profile): Promise<{
    settings: ProfileSettings;
    saved: FullUserDto[];
  }> {
    const fixture = TestBed.createComponent(ProfileSettings);
    fixture.componentRef.setInput('profile', shown);
    const saved: FullUserDto[] = [];
    fixture.componentInstance.saved.subscribe((value) => saved.push(value));
    await fixture.whenStable();

    return { settings: fixture.componentInstance, saved };
  }

  function answerWith(stored: Partial<FullUserDto>): AppResult<FullUserDto> {
    return { succeeded: true, data: { ...profile, ...stored } };
  }

  it('fills the form from the profile, the date of birth as the calendar date', async () => {
    const { settings } = await openSettings();

    expect(settings['form'].getRawValue()).toEqual({
      username: 'john_doe',
      dateOfBirth: '2000-04-01',
      bio: 'Hello',
    });
  });

  it('sends the form, with no bio when it is empty, and hands the saved profile on', async () => {
    userApi.editMine.mockResolvedValue(answerWith({ bio: null }));
    const { settings, saved } = await openSettings();
    settings['form'].controls.bio.setValue('  ');

    await settings.save();

    expect(userApi.editMine).toHaveBeenCalledWith({
      username: 'john_doe',
      dateOfBirth: '2000-04-01',
      bio: null,
    });
    expect(saved).toEqual([{ ...profile, bio: null }]);
    expect(TestBed.inject(ToastStore).visible()).toHaveLength(1);
  });

  it('refreshes the session when the username changed, so that it follows', async () => {
    userApi.editMine.mockResolvedValue(
      answerWith({ username: 'jane_doe', usernameLastChangedAt: '2026-11-24T10:00:00Z' }),
    );
    const { settings, saved } = await openSettings();
    settings['form'].controls.username.setValue('Jane_Doe');

    await settings.save();

    expect(sessionStore.refresh).toHaveBeenCalledTimes(1);
    expect(saved[0].username).toBe('jane_doe');
    expect(settings['form'].controls.username.value).toBe('jane_doe');
  });

  it('leaves the session alone when only the bio changed', async () => {
    userApi.editMine.mockResolvedValue(answerWith({ bio: 'New bio' }));
    const { settings } = await openSettings();
    settings['form'].controls.bio.setValue('New bio');

    await settings.save();

    expect(sessionStore.refresh).not.toHaveBeenCalled();
  });

  it("puts the server's refusal of a second username change beside the username", async () => {
    const refusal = 'Username can be changed again on 2026-12-01';
    userApi.editMine.mockResolvedValue({ succeeded: false, message: refusal, status: 400 });
    const { settings, saved } = await openSettings();
    settings['form'].controls.username.setValue('jane_doe');

    await settings.save();

    expect(settings['form'].controls.username.errors?.[serverErrorKey]).toEqual([refusal]);
    expect(settings['failureMessage']()).toBeNull();
    expect(saved).toEqual([]);
    expect(sessionStore.refresh).not.toHaveBeenCalled();
    expect(TestBed.inject(ToastStore).visible()).toEqual([]);
  });

  it('shows another refusal above the button', async () => {
    userApi.editMine.mockResolvedValue({
      succeeded: false,
      message: 'User not found',
      status: 400,
    });
    const { settings } = await openSettings();

    await settings.save();

    expect(settings['failureMessage']()).toBe('User not found');
  });

  it('does not send a form that is not valid', async () => {
    const { settings } = await openSettings();
    settings['form'].controls.username.setValue('ab');

    await settings.save();

    expect(userApi.editMine).not.toHaveBeenCalled();
  });

  describe('the note under the username', () => {
    it('says the username was never changed', async () => {
      const { settings } = await openSettings();

      const hint = settings['usernameHint']();

      expect(hint).toContain('Your username can change once in 20 days.');
      expect(hint).toContain('You have not changed it yet.');
    });

    it('gives the date it can change again while the cooldown runs', async () => {
      const { settings } = await openSettings({
        ...profile,
        usernameLastChangedAt: new Date().toISOString(),
      });

      const hint = settings['usernameHint']();

      expect(hint).toContain('You last changed it on');
      expect(hint).toContain('You can change it again on');
    });

    it('says it can change now once the cooldown is over', async () => {
      const { settings } = await openSettings({
        ...profile,
        usernameLastChangedAt: '2020-01-01T00:00:00Z',
      });

      expect(settings['usernameHint']()).toContain('You can change it now.');
    });
  });
});
