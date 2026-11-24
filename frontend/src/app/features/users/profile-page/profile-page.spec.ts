import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MockInstance } from 'vitest';
import { appAddresses } from '../../../core/routing/app-addresses';
import { SessionStore } from '../../../core/session/session-store';
import { UserApi } from '../user-api';
import { ProfilePage } from './profile-page';
import { ProfilePageStatus } from './profile-page-status';

// Class-level tests: the page is created with stubbed collaborators, and the tests read the navigation
// and the page's state, never the DOM (conventions, Tests and linting).
describe('ProfilePage', () => {
  const notFound = { succeeded: false, message: 'User not found', status: 404 };

  let userApi: { getByUsername: ReturnType<typeof vi.fn> };
  let sessionStore: { currentUsernameOf: ReturnType<typeof vi.fn> };
  let navigate: MockInstance<Router['navigate']>;

  beforeEach(() => {
    userApi = { getByUsername: vi.fn().mockResolvedValue(notFound) };
    sessionStore = { currentUsernameOf: vi.fn().mockReturnValue(null) };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: UserApi, useValue: userApi },
        { provide: SessionStore, useValue: sessionStore },
      ],
    });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function openPageOf(username: string): Promise<ProfilePage> {
    const fixture = TestBed.createComponent(ProfilePage);
    fixture.componentRef.setInput('username', username);
    await fixture.whenStable();

    return fixture.componentInstance;
  }

  it('shows the not-found page for a username nobody has', async () => {
    const page = await openPageOf('nobody');

    expect(page['status']()).toBe(ProfilePageStatus.NotFound);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("replaces the address with the signed-in user's new name when they had the one asked for", async () => {
    sessionStore.currentUsernameOf.mockReturnValue('johnny');

    await openPageOf('john_doe');

    expect(sessionStore.currentUsernameOf).toHaveBeenCalledWith('john_doe');
    expect(navigate).toHaveBeenCalledWith(appAddresses.profile('johnny'), { replaceUrl: true });
  });
});
