import { Injectable, inject } from '@angular/core';
import { HubClient } from '../../core/hub/hub-client';

// The least time between two SendTyping calls to the same friend. The backend does not throttle.
export const typingSignalIntervalMilliseconds = 2_000;

// Tells a friend that the user is writing to them. The message box calls typed() on every keystroke, and
// the hub is called at most once every 2 seconds per friend: the first keystroke goes at once, and the
// ones that follow within the interval are dropped. The friend's screen hides "typing…" 3 seconds after
// the last signal, so a signal every 2 seconds keeps it shown.
// It is apart from TypingStore, which the hub client feeds: the hub client cannot be injected there.
@Injectable({ providedIn: 'root' })
export class TypingSender {
  private readonly hubClient = inject(HubClient);
  private readonly lastSentAtByFriend = new Map<number, number>();

  typed(friendId: number): void {
    const now = Date.now();
    const lastSentAt = this.lastSentAtByFriend.get(friendId);
    const isDue = lastSentAt === undefined || now - lastSentAt >= typingSignalIntervalMilliseconds;

    if (isDue) {
      this.lastSentAtByFriend.set(friendId, now);
      void this.hubClient.sendTyping(friendId); // fire-and-forget: a lost signal only hides "typing…"
    }
  }
}
