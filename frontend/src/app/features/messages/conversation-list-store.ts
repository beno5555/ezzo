import { Injectable, computed, inject, signal } from '@angular/core';
import { LIMITS } from '../../core/limits';
import { PageLoadStatus } from '../../core/paging/page-load-status';
import { DisplayFriendDto } from '../friendships/display-friend-dto';
import { PresenceStore } from '../friendships/presence-store';
import { isUnavailableUsername } from '../users/unavailable-username';
import { ConversationFriendDto } from './conversation-friend-dto';
import { MessageApi } from './message-api';
import { StandardMessageDto } from './standard-message-dto';

// How many conversations one page of the list holds.
export const conversationListPageSize = 20;
// How many times refresh reads the list when messages keep changing it while it waits.
const maxRefreshAttempts = 3;

// The conversation list: one row per friend with a conversation, most recent first, each with the last
// message and the count of unread ones. It reads the list page by page, and ConversationsStore keeps it
// right without a reload as messages are sent, received, changed and deleted (putOnTop, showLastMessage,
// remove, refresh). The friends' presence comes from PresenceStore, so a row follows UserOnline and
// UserOffline too.
@Injectable({ providedIn: 'root' })
export class ConversationListStore {
  private readonly messageApi = inject(MessageApi);
  private readonly presenceStore = inject(PresenceStore);

  private readonly rows = signal<readonly ConversationFriendDto[]>([]);
  private readonly currentStatus = signal<PageLoadStatus>(PageLoadStatus.Idle);
  private readonly lastFailure = signal<string | null>(null);
  private nextPageNumber: number = LIMITS.paging.firstPageNumber;
  // True from load until its first page arrives, which then replaces the rows.
  private isRestarting = false;
  // Numbers each read of the list, so that only the answer to the newest one is kept.
  private readNumber = 0;
  // Counts the changes that messages make to the rows, so that refresh can tell its answer is out of date.
  private localChangeNumber = 0;
  // The friend whose conversation the open conversation marked read. A page that was read before the mark
  // can arrive after it, and must not bring the old count back.
  private readFriendId: number | null = null;

  // The rows, most recent conversation first, each friend with their live presence.
  readonly conversations = computed(() =>
    this.rows().map((row) => ({
      ...row,
      conversationFriend: this.presenceStore.withPresence(row.conversationFriend),
    })),
  );
  readonly status = this.currentStatus.asReadonly();
  // The text of the last failed page of the list, null once a page arrives.
  readonly failure = this.lastFailure.asReadonly();
  readonly hasRows = computed(() => this.rows().length > 0);

  // Reads the list from its first page, replacing the rows once that page arrives.
  async load(): Promise<void> {
    this.nextPageNumber = LIMITS.paging.firstPageNumber;
    this.isRestarting = true;
    await this.loadPage();
  }

  // From the end of the list, and from its Try again button: the next page, or the one that failed.
  async loadMore(): Promise<void> {
    const canLoad =
      this.currentStatus() === PageLoadStatus.Idle ||
      this.currentStatus() === PageLoadStatus.Failed;

    if (canLoad) {
      await this.loadPage();
    }
  }

  // A friend the list holds under that username, or null. A placeholder name (an unavailable account) can
  // stand for several rows, so it never matches.
  friendOf(username: string): DisplayFriendDto | null {
    const isAddressable = !isUnavailableUsername(username);
    const row = this.rows().find((shown) => shown.conversationFriend.username === username);

    return isAddressable ? (row?.conversationFriend ?? null) : null;
  }

  // The friend's row goes first, with the message as its last; a friend without a row gets one.
  putOnTop(
    friend: DisplayFriendDto,
    last: StandardMessageDto,
    senderId: number,
    unreadCountOf: (count: number) => number,
  ): void {
    this.localChangeNumber++;
    this.rows.update((rows) => {
      const shown = rows.find((row) => row.conversationFriend.id === friend.id);
      const moved: ConversationFriendDto = {
        conversationFriend: shown?.conversationFriend ?? friend,
        lastMessageContent: last.content,
        lastMessageSentAt: last.sentAt,
        lastMessageSenderId: senderId,
        lastMessageImageCount: last.images.length,
        unreadCount: unreadCountOf(shown?.unreadCount ?? 0),
      };

      return [moved, ...rows.filter((row) => row !== shown)];
    });
  }

  // The friend's row says what the conversation's last message is now, in its place in the list.
  showLastMessage(friendId: number, last: StandardMessageDto): void {
    this.localChangeNumber++;
    this.rows.update((rows) =>
      mostRecentFirst(
        rows.map((row) =>
          row.conversationFriend.id === friendId
            ? {
                ...row,
                lastMessageContent: last.content,
                lastMessageSentAt: last.sentAt,
                lastMessageSenderId: last.sender.id ?? row.lastMessageSenderId,
                lastMessageImageCount: last.images.length,
              }
            : row,
        ),
      ),
    );
  }

  // The backend lists only conversations that hold a message, so a conversation emptied drops its row.
  remove(friendId: number): void {
    this.localChangeNumber++;
    this.rows.update((rows) => rows.filter((row) => row.conversationFriend.id !== friendId));
  }

  // The backend marked the friend's conversation read when its history was read.
  markRead(friendId: number): void {
    this.readFriendId = friendId;
    this.rows.update((rows) => rows.map((row) => this.withReadCountCleared(row)));
  }

  // The open conversation changed or closed: no friend's conversation is the one being read.
  forgetRead(): void {
    this.readFriendId = null;
  }

  // Reads the first page again and replaces the rows it holds, leaving the others and the paging alone,
  // so that the list does not flicker or lose its place. When that page is the whole list, a row it does
  // not hold any more (its conversation lost its last message) is dropped. The rows stay most recent first.
  // An answer that was read before a message moved a row (putOnTop and the others below) is out of date,
  // so it is not applied: the list is read again, up to a few times.
  async refresh(attemptsLeft = maxRefreshAttempts): Promise<void> {
    const readNumber = this.readNumber;
    const localChangeNumber = this.localChangeNumber;
    const result = await this.messageApi.getConversationFriends({
      pageNumber: LIMITS.paging.firstPageNumber,
      pageSize: conversationListPageSize,
    });
    const isNewestRead = readNumber === this.readNumber;
    const isOutOfDate = localChangeNumber !== this.localChangeNumber;

    if (result.succeeded && isNewestRead) {
      if (isOutOfDate) {
        if (attemptsLeft > 1) {
          await this.refresh(attemptsLeft - 1);
        }
      } else {
        const fresh = new Map(result.data.map((row) => [row.conversationFriend.id, row]));
        const isWholeList = result.data.length < conversationListPageSize;
        this.rows.update((rows) =>
          mostRecentFirst(
            rows
              .filter((row) => !isWholeList || fresh.has(row.conversationFriend.id))
              .map((row) => this.withReadCountCleared(fresh.get(row.conversationFriend.id) ?? row)),
          ),
        );
      }
    }
  }

  // On sign-out.
  clear(): void {
    this.readNumber++;
    this.rows.set([]);
    this.currentStatus.set(PageLoadStatus.Idle);
    this.lastFailure.set(null);
    this.nextPageNumber = LIMITS.paging.firstPageNumber;
    this.isRestarting = false;
    this.readFriendId = null;
  }

  private async loadPage(): Promise<void> {
    this.readNumber++;
    const thisReadNumber = this.readNumber;
    const pageNumber = this.nextPageNumber;
    const askedAt = Date.now();
    this.currentStatus.set(PageLoadStatus.Loading);

    const result = await this.messageApi.getConversationFriends({
      pageNumber,
      pageSize: conversationListPageSize,
    });

    const isNewestRead = thisReadNumber === this.readNumber;
    if (isNewestRead) {
      if (result.succeeded) {
        this.presenceStore.track(
          result.data.map((row) => row.conversationFriend),
          askedAt,
        );
        const page = result.data.map((row) => this.withReadCountCleared(row));
        const shownRows = this.isRestarting ? [] : this.rows();
        this.rows.set(withNewRows(shownRows, page));
        this.isRestarting = false;
        this.nextPageNumber = pageNumber + 1;
        this.lastFailure.set(null);
        const isLastPage = result.data.length < conversationListPageSize;
        this.currentStatus.set(isLastPage ? PageLoadStatus.Ended : PageLoadStatus.Idle);
      } else {
        this.lastFailure.set(result.message);
        this.currentStatus.set(PageLoadStatus.Failed);
      }
    }
  }

  private withReadCountCleared(row: ConversationFriendDto): ConversationFriendDto {
    const isRead = row.conversationFriend.id === this.readFriendId;

    return isRead ? { ...row, unreadCount: 0 } : row;
  }
}

// The backend lists the conversations by the time of their last message, newest first. Rows with the same
// time keep their order.
function mostRecentFirst(rows: readonly ConversationFriendDto[]): readonly ConversationFriendDto[] {
  return [...rows].sort(
    (first, second) => Date.parse(second.lastMessageSentAt) - Date.parse(first.lastMessageSentAt),
  );
}

// A later page of the list can repeat a row when a conversation moved up between two reads.
function withNewRows(
  rows: readonly ConversationFriendDto[],
  page: readonly ConversationFriendDto[],
): readonly ConversationFriendDto[] {
  const shownIds = new Set(rows.map((row) => row.conversationFriend.id));
  const fresh = page.filter((row) => !shownIds.has(row.conversationFriend.id));

  return [...rows, ...fresh];
}
