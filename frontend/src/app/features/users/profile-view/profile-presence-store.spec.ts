import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AcceptedFriendshipDto } from '../../friendships/accepted-friendship-dto';
import { DisplayFriendDto } from '../../friendships/display-friend-dto';
import { FriendshipApi } from '../../friendships/friendship-api';
import { FriendshipStatus } from '../../friendships/friendship-status';
import { PresenceStore } from '../../friendships/presence-store';
import { ProfilePresenceStore } from './profile-presence-store';

const now = new Date('2026-11-24T12:00:00Z');
const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();

function friend(lastActiveAt: string | null): DisplayFriendDto {
  return { id: 3, username: 'alice', lastActiveAt, isActive: lastActiveAt === null };
}

function accepted(otherUser: DisplayFriendDto): AcceptedFriendshipDto {
  return {
    otherUser,
    status: FriendshipStatus.Accepted,
    sentAt: '2026-01-01T00:00:00Z',
    lastUpdatedAt: null,
  };
}

describe('ProfilePresenceStore', () => {
  let presence: ProfilePresenceStore;
  let presenceStore: PresenceStore;
  let answer: { succeeded: boolean; data?: AcceptedFriendshipDto };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    answer = { succeeded: true, data: accepted(friend(null)) };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ProfilePresenceStore,
        { provide: FriendshipApi, useValue: { getAcceptedFriendship: async () => answer } },
      ],
    });
    presence = TestBed.inject(ProfilePresenceStore);
    presenceStore = TestBed.inject(PresenceStore);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows nothing before the friend is read, and for a friend the backend does not give', async () => {
    expect(presence.dot()).toBeNull();

    answer = { succeeded: false };
    await presence.watch(3);

    expect(presence.dot()).toBeNull();
  });

  it('shows a green dot, with no last active time, while the friend is online', async () => {
    await presence.watch(3);

    expect(presence.dot()).toEqual({ lastActiveAt: null });
  });

  it('shows a grey dot for a friend who was active within a day', async () => {
    const lastActiveAt = minutesAgo(90);
    answer = { succeeded: true, data: accepted(friend(lastActiveAt)) };

    await presence.watch(3);

    expect(presence.dot()).toEqual({ lastActiveAt });
  });

  it('shows no dot for a friend who was last active a day ago or more', async () => {
    answer = { succeeded: true, data: accepted(friend(minutesAgo(24 * 60))) };

    await presence.watch(3);

    expect(presence.dot()).toBeNull();
  });

  it('follows the hub: online turns the dot green, and offline turns it grey', async () => {
    answer = { succeeded: true, data: accepted(friend(minutesAgo(30))) };
    await presence.watch(3);

    presenceStore.markOffline(3, minutesAgo(1));
    expect(presence.dot()).toEqual({ lastActiveAt: minutesAgo(1) });

    await presenceStore.markOnline(3);
    expect(presence.dot()).toEqual({ lastActiveAt: null });
  });

  it('does not bring the dot back when the friend is removed while the read is under way', async () => {
    const reading = presence.watch(3);

    presence.forget();
    await reading;

    expect(presence.dot()).toBeNull();
  });

  it('drops the dot when the two are no longer friends', async () => {
    await presence.watch(3);

    presence.forget();

    expect(presence.dot()).toBeNull();
  });
});
