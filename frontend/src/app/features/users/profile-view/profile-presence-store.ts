import { Injectable, computed, inject, signal } from '@angular/core';
import { DateFormatter } from '../../../core/languages/date-formatter';
import { FriendshipApi } from '../../friendships/friendship-api';
import { PresenceStore } from '../../friendships/presence-store';

// Whether the friend whose profile is open is online, for the dot on their picture. A profile provides its
// own (providers: [ProfilePresenceStore]). Only a friend has one: the user's own profile and a stranger's show
// none. watch() reads the friend's presence once from the backend and hands it to PresenceStore, which the
// hub's UserOnline and UserOffline events then keep up to date, so the dot changes while the profile is open.
// The dot is green while the friend is online, grey for a day after they were last active (no time on it;
// the badge count in a list is for a list), and absent after that: an old visit says nothing useful.
//   await this.presence.watch(user.id);
//   @if (presence.dot(); as dot) { <app-presence-dot [lastActiveAt]="dot.lastActiveAt" [showsAwayTime]="false" /> }
@Injectable()
export class ProfilePresenceStore {
  private readonly friendshipApi = inject(FriendshipApi);
  private readonly presenceStore = inject(PresenceStore);
  private readonly dateFormatter = inject(DateFormatter);

  private readonly friendId = signal<number | null>(null);
  // Counts the reads started and the forgets, so that only the newest read may set the friend.
  private reads = 0;

  // What the profile shows of the friend's presence: lastActiveAt is null while they are online (a green dot).
  readonly dot = computed<{ lastActiveAt: string | null } | null>(() => {
    const friendId = this.friendId();
    const friend = this.presenceStore.friends().find(({ id }) => id === friendId);
    const lastActiveAt = friend?.lastActiveAt ?? null;
    const isKnown = friend !== undefined;
    const isOnline = isKnown && lastActiveAt === null;
    const isRecent =
      lastActiveAt !== null && this.dateFormatter.shortTimeSince(lastActiveAt) !== null;

    return isOnline || isRecent ? { lastActiveAt } : null;
  });

  // The visitor and this person are no longer friends (the friend was removed on the profile). A read
  // still under way is dropped, so its late answer does not bring the dot back.
  forget(): void {
    this.reads += 1;
    this.friendId.set(null);
  }

  // A failed read leaves the dot out: presence is a nicety, and the profile says nothing about it.
  async watch(friendId: number): Promise<void> {
    this.reads += 1;
    const read = this.reads;
    const askedAt = Date.now();
    const result = await this.friendshipApi.getAcceptedFriendship(friendId);
    const isCurrent = read === this.reads;

    if (result.succeeded && isCurrent) {
      this.presenceStore.track([result.data.otherUser], askedAt);
      this.friendId.set(friendId);
    }
  }
}
