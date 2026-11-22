import { Injectable, signal } from '@angular/core';
import { Debouncer } from '../../core/timing/debouncer';
import { UserTypingDto } from './user-typing-dto';

// How long after the last UserTyping a friend's "typing…" stays. The backend sends no "stopped typing".
export const typingHideMilliseconds = 3_000;

// Which friends are writing to the user right now. The hub hands it each UserTyping (userTyping); the
// conversation shows "typing…" while isTyping(friendId) holds. A friend stops typing 3 seconds after their
// last event, or the moment a message from them arrives (ConversationsStore calls stop).
@Injectable({ providedIn: 'root' })
export class TypingStore {
  private readonly typingIds = signal<ReadonlySet<number>>(new Set());
  // One quiet-period timer per friend: each UserTyping restarts it.
  private readonly hideTimers = new Map<number, Debouncer>();

  isTyping(friendId: number): boolean {
    return this.typingIds().has(friendId);
  }

  userTyping({ userId }: UserTypingDto): void {
    this.typingIds.update((ids) => new Set(ids).add(userId));
    this.hideTimerOf(userId).call();
  }

  stop(friendId: number): void {
    this.hideTimers.get(friendId)?.cancel();
    this.typingIds.update((ids) => {
      const rest = new Set(ids);
      rest.delete(friendId);

      return rest;
    });
  }

  // On sign-out.
  clear(): void {
    for (const timer of this.hideTimers.values()) {
      timer.cancel();
    }
    this.hideTimers.clear();
    this.typingIds.set(new Set());
  }

  private hideTimerOf(friendId: number): Debouncer {
    let timer = this.hideTimers.get(friendId);

    if (timer === undefined) {
      timer = new Debouncer(() => this.stop(friendId), typingHideMilliseconds);
      this.hideTimers.set(friendId, timer);
    }

    return timer;
  }
}
