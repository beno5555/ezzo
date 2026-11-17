import { Injectable, inject, signal } from '@angular/core';
import { MessageApi } from './message-api';

// The number of conversations with unread messages. It is always read from the backend, never computed here,
// because the count is of conversations and the client does not hold every conversation.
@Injectable({ providedIn: 'root' })
export class UnreadStore {
  private readonly messageApi = inject(MessageApi);

  private readonly latestCount = signal<number | null>(null);
  // Numbers each read, so that only the answer to the newest one is kept.
  private readNumber = 0;

  // Null until the first read answers.
  readonly count = this.latestCount.asReadonly();

  // Called after anything that can change the count. A failed read keeps the last count.
  async refresh(): Promise<void> {
    this.readNumber++;
    const thisReadNumber = this.readNumber;
    const result = await this.messageApi.getUnreadCount();

    const isNewestRead = thisReadNumber === this.readNumber;
    if (result.succeeded && isNewestRead) {
      this.latestCount.set(result.data.unreadCount);
    }
  }

  // On sign-out. A read still on its way is ignored when it answers.
  clear(): void {
    this.readNumber++;
    this.latestCount.set(null);
  }
}
