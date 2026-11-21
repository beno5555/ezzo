import { HttpStatusCode } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { AppResult } from '../../core/http/app-result';
import { LIMITS } from '../../core/limits';
import { PageLoadStatus } from '../../core/paging/page-load-status';
import { AcceptedFriendshipDto } from '../friendships/accepted-friendship-dto';
import { DisplayFriendDto } from '../friendships/display-friend-dto';
import { FriendshipApi } from '../friendships/friendship-api';
import { PresenceStore } from '../friendships/presence-store';
import { isUnavailableUsername } from '../users/unavailable-username';
import { UserApi } from '../users/user-api';
import { ConversationFriendDto } from './conversation-friend-dto';
import { ConversationOpenStatus } from './conversation-open-status';
import { MessageApi } from './message-api';
import { OpenConversation } from './open-conversation';
import { StandardMessageDto } from './standard-message-dto';
import { UnreadStore } from './unread-store';

// How many conversations one page of the list holds, and how many messages one page of the history.
export const conversationListPageSize = 20;
export const messageHistoryPageSize = 30;

// The chat's shared state: the conversation list and the open conversation. It is a store because the hub
// changes both (ticket 19). The friends' presence comes from PresenceStore, so a row and the open
// conversation follow UserOnline and UserOffline without a reload.
//
// The pages address a conversation by username, while the message endpoints take the id, so open() finds
// the friend first: in the loaded list, or else through the read by username and the friendship check.
// Reading the first page of the history marks the conversation read on the backend; the store then clears
// the row's count and has UnreadStore read its number again.
@Injectable({ providedIn: 'root' })
export class ConversationsStore {
  private readonly messageApi = inject(MessageApi);
  private readonly userApi = inject(UserApi);
  private readonly friendshipApi = inject(FriendshipApi);
  private readonly presenceStore = inject(PresenceStore);
  private readonly unreadStore = inject(UnreadStore);

  private readonly rows = signal<readonly ConversationFriendDto[]>([]);
  private readonly currentListStatus = signal<PageLoadStatus>(PageLoadStatus.Idle);
  private readonly lastListFailure = signal<string | null>(null);
  private nextListPageNumber: number = LIMITS.paging.firstPageNumber;
  // True from loadConversations until its first page arrives, which then replaces the rows.
  private isListRestarting = false;
  // Numbers each read of the list, so that only the answer to the newest one is kept.
  private listReadNumber = 0;

  private readonly opened = signal<OpenConversation | null>(null);
  private nextHistoryPageNumber: number = LIMITS.paging.firstPageNumber;
  // Numbers each opening, so that answers meant for a conversation the user has left are ignored.
  private openingNumber = 0;
  // The friend whose conversation the current opening marked read. A list page that was read before the
  // mark can arrive after it, and must not bring the old count back.
  private readFriendId: number | null = null;

  private readonly lastActiveById = computed(
    () => new Map(this.presenceStore.friends().map((friend) => [friend.id, friend.lastActiveAt])),
  );

  // The rows, most recent conversation first, each friend with their live presence.
  readonly conversations = computed(() =>
    this.rows().map((row) => ({
      ...row,
      conversationFriend: this.withPresence(row.conversationFriend),
    })),
  );
  readonly listStatus = this.currentListStatus.asReadonly();
  // The text of the last failed page of the list, null once a page arrives.
  readonly listFailure = this.lastListFailure.asReadonly();

  // Null while no conversation is open.
  readonly openConversation = computed(() => {
    const conversation = this.opened();
    const friend = conversation?.friend ?? null;

    return conversation !== null && friend !== null
      ? { ...conversation, friend: this.withPresence(friend) }
      : conversation;
  });

  // Reads the list from its first page, replacing the rows once that page arrives.
  async loadConversations(): Promise<void> {
    this.nextListPageNumber = LIMITS.paging.firstPageNumber;
    this.isListRestarting = true;
    await this.loadListPage();
  }

  // From the end of the list, and from its Try again button: the next page, or the one that failed.
  async loadMoreConversations(): Promise<void> {
    const canLoad =
      this.currentListStatus() === PageLoadStatus.Idle ||
      this.currentListStatus() === PageLoadStatus.Failed;

    if (canLoad) {
      await this.loadListPage();
    }
  }

  // Opens the conversation at /messages/:username, and again from a Try again button after a failure.
  async open(username: string): Promise<void> {
    this.openingNumber++;
    const opening = this.openingNumber;
    this.readFriendId = null;
    this.nextHistoryPageNumber = LIMITS.paging.firstPageNumber;
    const listedFriend = this.listedFriend(username);

    if (listedFriend !== null) {
      this.opened.set(conversationWith(username, listedFriend));
      await this.loadHistoryPage(opening, listedFriend.id);
    } else {
      this.opened.set(conversationLoading(username));
      await this.findFriend(opening, username);
    }
  }

  // From the top of the history, and from its Try again button: the next older page, or the one that failed.
  async loadOlderMessages(): Promise<void> {
    const conversation = this.opened();
    const friend = conversation?.friend ?? null;
    const canLoad =
      friend !== null &&
      (conversation?.historyStatus === PageLoadStatus.Idle ||
        conversation?.historyStatus === PageLoadStatus.Failed);

    if (canLoad) {
      await this.loadHistoryPage(this.openingNumber, friend.id);
    }
  }

  // When the conversation leaves the screen. An answer still on its way is ignored when it arrives.
  close(): void {
    this.openingNumber++;
    this.readFriendId = null;
    this.opened.set(null);
  }

  // On sign-out.
  clear(): void {
    this.close();
    this.listReadNumber++;
    this.rows.set([]);
    this.currentListStatus.set(PageLoadStatus.Idle);
    this.lastListFailure.set(null);
    this.nextListPageNumber = LIMITS.paging.firstPageNumber;
    this.isListRestarting = false;
  }

  private async loadListPage(): Promise<void> {
    this.listReadNumber++;
    const thisReadNumber = this.listReadNumber;
    const pageNumber = this.nextListPageNumber;
    const askedAt = Date.now();
    this.currentListStatus.set(PageLoadStatus.Loading);

    const result = await this.messageApi.getConversationFriends({
      pageNumber,
      pageSize: conversationListPageSize,
    });

    const isNewestRead = thisReadNumber === this.listReadNumber;
    if (isNewestRead) {
      if (result.succeeded) {
        this.presenceStore.track(
          result.data.map((row) => row.conversationFriend),
          askedAt,
        );
        const page = result.data.map((row) => this.withReadCountCleared(row));
        const shownRows = this.isListRestarting ? [] : this.rows();
        this.rows.set(withNewRows(shownRows, page));
        this.isListRestarting = false;
        this.nextListPageNumber = pageNumber + 1;
        this.lastListFailure.set(null);
        const isLastPage = result.data.length < conversationListPageSize;
        this.currentListStatus.set(isLastPage ? PageLoadStatus.Ended : PageLoadStatus.Idle);
      } else {
        this.lastListFailure.set(result.message);
        this.currentListStatus.set(PageLoadStatus.Failed);
      }
    }
  }

  // A friend the list holds under that username. A placeholder name (an unavailable account) can stand for
  // several rows, so it never matches.
  private listedFriend(username: string): DisplayFriendDto | null {
    const isAddressable = !isUnavailableUsername(username);
    const row = this.rows().find((shown) => shown.conversationFriend.username === username);

    return isAddressable && row !== undefined ? row.conversationFriend : null;
  }

  private async findFriend(opening: number, username: string): Promise<void> {
    const userResult = await this.userApi.getByUsername(username);

    if (this.isCurrent(opening)) {
      if (userResult.succeeded) {
        const askedAt = Date.now();
        const friendshipResult = await this.friendshipApi.getAcceptedFriendship(userResult.data.id);
        await this.takeFriendship(opening, username, friendshipResult, askedAt);
      } else {
        this.settleFailedLookup(opening, userResult, ConversationOpenStatus.NotFound);
      }
    }
  }

  private async takeFriendship(
    opening: number,
    username: string,
    result: AppResult<AcceptedFriendshipDto>,
    askedAt: number,
  ): Promise<void> {
    if (this.isCurrent(opening)) {
      if (result.succeeded) {
        const friend = result.data.otherUser;
        this.presenceStore.track([friend], askedAt);
        this.opened.set(conversationWith(username, friend));
        await this.loadHistoryPage(opening, friend.id);
      } else {
        this.settleFailedLookup(opening, result, ConversationOpenStatus.NotFriend);
      }
    }
  }

  // A 404 means the user or the friendship is not there; any other failure may pass, so it can be tried again.
  private settleFailedLookup(
    opening: number,
    result: { message: string; status: number },
    notFoundMeaning: ConversationOpenStatus,
  ): void {
    const isNotFound = result.status === HttpStatusCode.NotFound;
    this.updateOpened(opening, {
      status: isNotFound ? notFoundMeaning : ConversationOpenStatus.Failed,
      failureMessage: isNotFound ? null : result.message,
    });
  }

  private async loadHistoryPage(opening: number, friendId: number): Promise<void> {
    const pageNumber = this.nextHistoryPageNumber;
    this.updateOpened(opening, { historyStatus: PageLoadStatus.Loading });

    const result = await this.messageApi.getConversation(friendId, {
      pageNumber,
      pageSize: messageHistoryPageSize,
    });

    if (this.isCurrent(opening)) {
      if (result.succeeded) {
        this.nextHistoryPageNumber = pageNumber + 1;
        const isLastPage = result.data.length < messageHistoryPageSize;
        this.opened.update(
          (conversation) =>
            conversation && {
              ...conversation,
              messages: withOlderMessages(conversation.messages, result.data),
              historyStatus: isLastPage ? PageLoadStatus.Ended : PageLoadStatus.Idle,
              historyFailure: null,
            },
        );
        const isFirstPage = pageNumber === LIMITS.paging.firstPageNumber;
        if (isFirstPage) {
          await this.markRead(friendId);
        }
      } else {
        this.updateOpened(opening, {
          historyStatus: PageLoadStatus.Failed,
          historyFailure: result.message,
        });
      }
    }
  }

  // The backend marked the conversation read when its history was read.
  private async markRead(friendId: number): Promise<void> {
    this.readFriendId = friendId;
    this.rows.update((rows) => rows.map((row) => this.withReadCountCleared(row)));
    await this.unreadStore.refresh();
  }

  private withReadCountCleared(row: ConversationFriendDto): ConversationFriendDto {
    const isRead = row.conversationFriend.id === this.readFriendId;

    return isRead ? { ...row, unreadCount: 0 } : row;
  }

  private withPresence(friend: DisplayFriendDto): DisplayFriendDto {
    const lastActiveById = this.lastActiveById();
    const lastActiveAt = lastActiveById.has(friend.id)
      ? (lastActiveById.get(friend.id) ?? null)
      : friend.lastActiveAt;

    return { ...friend, lastActiveAt, isActive: lastActiveAt === null };
  }

  private isCurrent(opening: number): boolean {
    return opening === this.openingNumber;
  }

  private updateOpened(opening: number, change: Partial<OpenConversation>): void {
    if (this.isCurrent(opening)) {
      this.opened.update((conversation) => conversation && { ...conversation, ...change });
    }
  }
}

function conversationLoading(username: string): OpenConversation {
  return {
    username,
    status: ConversationOpenStatus.Loading,
    failureMessage: null,
    friend: null,
    messages: [],
    historyStatus: PageLoadStatus.Idle,
    historyFailure: null,
  };
}

function conversationWith(username: string, friend: DisplayFriendDto): OpenConversation {
  return { ...conversationLoading(username), status: ConversationOpenStatus.Ready, friend };
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

// An older page goes above what is shown. A message sent meanwhile pushes the pages back by one, so the
// older page can repeat a message that is already shown.
function withOlderMessages(
  shown: readonly StandardMessageDto[],
  olderPage: readonly StandardMessageDto[],
): readonly StandardMessageDto[] {
  const shownIds = new Set(shown.map((message) => message.id));
  const fresh = olderPage.filter((message) => !shownIds.has(message.id));

  return [...fresh, ...shown];
}
