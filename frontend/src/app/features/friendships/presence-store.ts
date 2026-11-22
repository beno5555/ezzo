import { Injectable, computed, inject, signal } from '@angular/core';
import { UserApi } from '../users/user-api';
import { DisplayFriendDto } from './display-friend-dto';
import { FriendPresence } from './friend-presence';

// username is null while a friend's name is being looked up; they are not shown until it arrives.
// liveEventAt is when a hub event last changed the friend (milliseconds, as Date.now()), null if none has.
type TrackedFriend = Omit<FriendPresence, 'username'> & {
  username: string | null;
  liveEventAt: number | null;
};

// Which friends are online, and when the others were last active. It starts from what friend rows carry
// and follows the hub's UserOnline and UserOffline events from there.
@Injectable({ providedIn: 'root' })
export class PresenceStore {
  private readonly userApi = inject(UserApi);

  private readonly friendsById = signal<ReadonlyMap<number, TrackedFriend>>(new Map());

  readonly friends = computed(() => [...this.friendsById().values()].flatMap(toShownFriend));
  readonly onlineFriends = computed(() =>
    this.friends().filter((friend) => friend.lastActiveAt === null),
  );

  private readonly lastActiveById = computed(
    () => new Map(this.friends().map((friend) => [friend.id, friend.lastActiveAt])),
  );

  // The friend with the presence the store holds for them; a friend it does not know stays as given.
  withPresence(friend: DisplayFriendDto): DisplayFriendDto {
    const lastActiveById = this.lastActiveById();
    const lastActiveAt = lastActiveById.has(friend.id)
      ? (lastActiveById.get(friend.id) ?? null)
      : friend.lastActiveAt;

    return { ...friend, lastActiveAt, isActive: lastActiveAt === null };
  }

  // Takes the presence that friend rows carry. askedAt is when the rows were asked for (as Date.now()):
  // a friend a hub event changed since then keeps what the event said, which is newer than the row.
  track(rows: DisplayFriendDto[], askedAt: number): void {
    this.friendsById.update((friendsById) => {
      const updated = new Map(friendsById);
      for (const { id, username, lastActiveAt } of rows) {
        const liveEventAt = friendsById.get(id)?.liveEventAt ?? null;
        const isRowNewer = liveEventAt === null || liveEventAt < askedAt;
        if (isRowNewer) {
          updated.set(id, { id, username, lastActiveAt, liveEventAt: null });
        }
      }

      return updated;
    });
  }

  // A friend whose name the store does not hold is looked up by id, and shown once the name arrives.
  async markOnline(userId: number): Promise<void> {
    const isKnown = this.friendsById().has(userId);

    if (isKnown) {
      this.applyLiveEvent(userId, null);
    } else {
      this.setFriend({ id: userId, username: null, lastActiveAt: null, liveEventAt: Date.now() });
      await this.lookUpUsername(userId);
    }
  }

  // A friend the store does not know is ignored: there is nothing to show for them.
  markOffline(userId: number, lastActiveAt: string): void {
    this.applyLiveEvent(userId, lastActiveAt);
  }

  // On sign-out. A lookup still on its way is ignored when it answers.
  clear(): void {
    this.friendsById.set(new Map());
  }

  private async lookUpUsername(userId: number): Promise<void> {
    const result = await this.userApi.getById(userId);
    const friend = this.friendsById().get(userId);

    const isStillAwaitingName = friend !== undefined && friend.username === null;
    if (isStillAwaitingName) {
      if (result.succeeded) {
        this.setFriend({ ...friend, username: result.data.username });
      } else {
        // Forgotten, so that the next online event looks the user up again.
        this.removeFriend(userId);
      }
    }
  }

  private applyLiveEvent(userId: number, lastActiveAt: string | null): void {
    const friend = this.friendsById().get(userId);

    if (friend !== undefined) {
      this.setFriend({ ...friend, lastActiveAt, liveEventAt: Date.now() });
    }
  }

  private setFriend(friend: TrackedFriend): void {
    this.friendsById.update((friendsById) => new Map(friendsById).set(friend.id, friend));
  }

  private removeFriend(userId: number): void {
    this.friendsById.update((friendsById) => {
      const updated = new Map(friendsById);
      updated.delete(userId);

      return updated;
    });
  }
}

// A friend without a name yet is not shown: an empty list leaves them out of flatMap.
function toShownFriend({ id, username, lastActiveAt }: TrackedFriend): FriendPresence[] {
  return username !== null ? [{ id, username, lastActiveAt }] : [];
}
