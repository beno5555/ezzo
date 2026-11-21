import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PageLoadStatus } from '../../core/paging/page-load-status';
import { waitForPendingWork } from '../../core/session/testing/wait-for-pending-work';
import { AcceptedFriendshipDto } from '../friendships/accepted-friendship-dto';
import { DisplayFriendDto } from '../friendships/display-friend-dto';
import { PresenceStore } from '../friendships/presence-store';
import { StandardUserDto } from '../users/standard-user-dto';
import { ConversationFriendDto } from './conversation-friend-dto';
import { ConversationOpenStatus } from './conversation-open-status';
import {
  ConversationsStore,
  conversationListPageSize,
  messageHistoryPageSize,
} from './conversations-store';
import { StandardMessageDto } from './standard-message-dto';
import { UnreadStore } from './unread-store';

const signedInUserId = 1;
const listAddress = '/api/messages/friends/conversation';
const unreadAddress = '/api/messages/conversations/unread';

const alice: DisplayFriendDto = { id: 3, username: 'alice', lastActiveAt: null, isActive: true };
const bob: DisplayFriendDto = {
  id: 4,
  username: 'bob',
  lastActiveAt: '2026-11-17T08:30:00Z',
  isActive: false,
};

function row(friend: DisplayFriendDto, unreadCount = 0): ConversationFriendDto {
  return {
    conversationFriend: friend,
    lastMessageContent: `Hi from ${friend.username}`,
    lastMessageSentAt: '2026-11-17T09:00:00Z',
    lastMessageSenderId: friend.id,
    lastMessageImageCount: 0,
    unreadCount,
  };
}

function message(id: number, sender: DisplayFriendDto): StandardMessageDto {
  return {
    id,
    content: `message ${id}`,
    images: [],
    sender: { id: sender.id, username: sender.username },
    receiverId: signedInUserId,
    sentAt: '2026-11-17T09:00:00Z',
    seen: true,
    seenAt: null,
    isEdited: false,
  };
}

// Messages first to last, as one page of the history lists them.
function messages(fromId: number, toId: number, sender: DisplayFriendDto): StandardMessageDto[] {
  const page: StandardMessageDto[] = [];
  for (let id = fromId; id <= toId; id++) {
    page.push(message(id, sender));
  }

  return page;
}

function user(friend: DisplayFriendDto): StandardUserDto {
  return {
    id: friend.id,
    username: friend.username,
    bio: null,
    dateOfBirth: '2000-01-01T00:00:00Z',
  };
}

function friendship(friend: DisplayFriendDto): AcceptedFriendshipDto {
  return {
    otherUser: friend,
    status: 'Accepted',
    sentAt: '2026-11-01T00:00:00Z',
    lastUpdatedAt: null,
  };
}

const envelope = <T>(data: T) => ({ succeeded: true, message: null, data });
const listEnvelope = <T>(data: T[]) => ({ succeeded: true, message: null, data, totalCount: 0 });

describe('ConversationsStore', () => {
  let store: ConversationsStore;
  let presenceStore: PresenceStore;
  let unreadStore: UnreadStore;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(ConversationsStore);
    presenceStore = TestBed.inject(PresenceStore);
    unreadStore = TestBed.inject(UnreadStore);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  // Answers the next page of the conversation list.
  async function answerList(rows: ConversationFriendDto[], pageNumber = 1): Promise<void> {
    const request = httpTesting.expectOne(
      (candidate) =>
        candidate.url === listAddress &&
        candidate.params.get('pageNumber') === `${pageNumber}` &&
        candidate.params.get('pageSize') === `${conversationListPageSize}`,
    );
    request.flush(listEnvelope(rows));
    await waitForPendingWork();
  }

  async function answerHistory(
    friend: DisplayFriendDto,
    page: StandardMessageDto[],
    pageNumber = 1,
  ): Promise<void> {
    const request = httpTesting.expectOne(
      (candidate) =>
        candidate.url === `/api/messages/conversation/${friend.id}` &&
        candidate.params.get('pageNumber') === `${pageNumber}` &&
        candidate.params.get('pageSize') === `${messageHistoryPageSize}`,
    );
    request.flush(listEnvelope(page));
    await waitForPendingWork();
  }

  async function answerUnread(unreadCount: number): Promise<void> {
    httpTesting.expectOne(unreadAddress).flush({ unreadCount });
    await waitForPendingWork();
  }

  async function loadList(rows: ConversationFriendDto[]): Promise<void> {
    const loading = store.loadConversations();
    await answerList(rows);
    await loading;
  }

  describe('the conversation list', () => {
    it('loads the first page, and ends when the page is shorter than the page size', async () => {
      await loadList([row(alice, 2), row(bob)]);

      expect(store.conversations()).toEqual([row(alice, 2), row(bob)]);
      expect(store.listStatus()).toBe(PageLoadStatus.Ended);
    });

    it('appends the next page while the pages are full', async () => {
      const fullPage = Array.from({ length: conversationListPageSize }, (_, index) =>
        row({ ...bob, id: 100 + index, username: `friend${index}` }),
      );
      await loadList(fullPage);
      expect(store.listStatus()).toBe(PageLoadStatus.Idle);

      const loadingMore = store.loadMoreConversations();
      await answerList([row(alice)], 2);
      await loadingMore;

      expect(store.conversations()).toEqual([...fullPage, row(alice)]);
      expect(store.listStatus()).toBe(PageLoadStatus.Ended);
    });

    it('starts again from the first page when loaded again', async () => {
      await loadList([row(alice, 2)]);

      await loadList([row(bob), row(alice)]);

      expect(store.conversations()).toEqual([row(bob), row(alice)]);
    });

    it('keeps the rows and says why when a page fails', async () => {
      await loadList([row(alice)]);

      const failing = store.loadConversations();
      httpTesting
        .expectOne((candidate) => candidate.url === listAddress)
        .flush(null, {
          status: 0,
          statusText: 'Unknown Error',
        });
      await failing;

      expect(store.conversations()).toEqual([row(alice)]);
      expect(store.listStatus()).toBe(PageLoadStatus.Failed);
      expect(store.listFailure()).not.toBeNull();
    });

    it('changes a row when its friend goes offline or comes online', async () => {
      await loadList([row(alice), row(bob)]);

      presenceStore.markOffline(alice.id, '2026-11-17T10:00:00Z');
      await presenceStore.markOnline(bob.id);

      const [aliceRow, bobRow] = store.conversations();
      expect(aliceRow.conversationFriend).toEqual({
        ...alice,
        lastActiveAt: '2026-11-17T10:00:00Z',
        isActive: false,
      });
      expect(bobRow.conversationFriend).toEqual({ ...bob, lastActiveAt: null, isActive: true });
    });
  });

  describe('opening a conversation', () => {
    it('finds a friend from the loaded list, without asking the backend who they are', async () => {
      await loadList([row(alice, 2)]);

      const opening = store.open('alice');
      expect(store.openConversation()?.status).toBe(ConversationOpenStatus.Ready);
      expect(store.openConversation()?.historyStatus).toBe(PageLoadStatus.Loading);
      await answerHistory(alice, messages(1, 3, alice));
      await answerUnread(0);
      await opening;

      expect(store.openConversation()).toEqual({
        username: 'alice',
        status: ConversationOpenStatus.Ready,
        failureMessage: null,
        friend: alice,
        messages: messages(1, 3, alice),
        historyStatus: PageLoadStatus.Ended,
        historyFailure: null,
      });
    });

    it('looks the username up, and checks the friendship, when the list does not hold it', async () => {
      const opening = store.open('bob');
      expect(store.openConversation()?.status).toBe(ConversationOpenStatus.Loading);
      httpTesting.expectOne('/api/users/bob').flush(envelope(user(bob)));
      await waitForPendingWork();
      httpTesting.expectOne('/api/friendships/accepted/4').flush(envelope(friendship(bob)));
      await waitForPendingWork();
      await answerHistory(bob, messages(1, 2, bob));
      await answerUnread(0);
      await opening;

      expect(store.openConversation()?.status).toBe(ConversationOpenStatus.Ready);
      expect(store.openConversation()?.friend).toEqual(bob);
      expect(store.openConversation()?.messages).toEqual(messages(1, 2, bob));
    });

    it('follows the presence of the open friend', async () => {
      await loadList([row(alice)]);
      const opening = store.open('alice');
      await answerHistory(alice, []);
      await answerUnread(0);
      await opening;

      presenceStore.markOffline(alice.id, '2026-11-17T10:00:00Z');

      expect(store.openConversation()?.friend?.lastActiveAt).toBe('2026-11-17T10:00:00Z');
    });

    it('says when no user has the username', async () => {
      const opening = store.open('nobody');
      httpTesting
        .expectOne('/api/users/nobody')
        .flush({ succeeded: false, message: 'User not found' }, { status: 404, statusText: '' });
      await opening;

      expect(store.openConversation()?.status).toBe(ConversationOpenStatus.NotFound);
      expect(store.openConversation()?.friend).toBeNull();
    });

    it('says when the user is not a friend', async () => {
      const opening = store.open('carol');
      httpTesting.expectOne('/api/users/carol').flush(envelope(user({ ...bob, id: 5 })));
      await waitForPendingWork();
      httpTesting
        .expectOne('/api/friendships/accepted/5')
        .flush({ succeeded: false, message: 'Not found' }, { status: 404, statusText: '' });
      await opening;

      expect(store.openConversation()?.status).toBe(ConversationOpenStatus.NotFriend);
    });

    it('says why when the lookup fails for another reason', async () => {
      const opening = store.open('bob');
      httpTesting.expectOne('/api/users/bob').flush(null, { status: 0, statusText: '' });
      await opening;

      expect(store.openConversation()?.status).toBe(ConversationOpenStatus.Failed);
      expect(store.openConversation()?.failureMessage).not.toBeNull();
    });

    it('ignores the answers for a conversation the user has left for another', async () => {
      await loadList([row(alice), row(bob)]);
      const openingAlice = store.open('alice');
      const openingBob = store.open('bob');

      await answerHistory(alice, messages(1, 2, alice));
      await answerHistory(bob, messages(5, 6, bob));
      await answerUnread(0);
      await Promise.all([openingAlice, openingBob]);

      expect(store.openConversation()?.username).toBe('bob');
      expect(store.openConversation()?.messages).toEqual(messages(5, 6, bob));
    });

    it('forgets the conversation when it is closed, and ignores what arrives afterwards', async () => {
      await loadList([row(alice, 2)]);
      const opening = store.open('alice');
      store.close();
      await answerHistory(alice, messages(1, 2, alice));
      await opening;

      expect(store.openConversation()).toBeNull();
      expect(store.conversations()[0].unreadCount).toBe(2);
    });
  });

  describe('marking the conversation read', () => {
    it('clears the row count and reads the unread number again once the history arrives', async () => {
      await loadList([row(alice, 2), row(bob, 1)]);

      const opening = store.open('alice');
      await answerHistory(alice, messages(1, 2, alice));
      await answerUnread(1);
      await opening;

      expect(store.conversations().map((shown) => shown.unreadCount)).toEqual([0, 1]);
      expect(unreadStore.count()).toBe(1);
    });

    it('keeps the count cleared when the list arrives after the conversation was read', async () => {
      const listLoading = store.loadConversations();
      const opening = store.open('alice');
      httpTesting.expectOne('/api/users/alice').flush(envelope(user(alice)));
      await waitForPendingWork();
      httpTesting.expectOne('/api/friendships/accepted/3').flush(envelope(friendship(alice)));
      await waitForPendingWork();
      await answerHistory(alice, messages(1, 2, alice));
      await answerUnread(0);
      await opening;

      await answerList([row(alice, 2), row(bob, 1)]);
      await listLoading;

      expect(store.conversations().map((shown) => shown.unreadCount)).toEqual([0, 1]);
    });

    it('marks nothing read when the history fails', async () => {
      await loadList([row(alice, 2)]);

      const opening = store.open('alice');
      httpTesting
        .expectOne((candidate) => candidate.url === '/api/messages/conversation/3')
        .flush(null, { status: 0, statusText: '' });
      await opening;

      expect(store.openConversation()?.historyStatus).toBe(PageLoadStatus.Failed);
      expect(store.openConversation()?.historyFailure).not.toBeNull();
      expect(store.conversations()[0].unreadCount).toBe(2);
    });
  });

  describe('older messages', () => {
    async function openAlice(firstPage: StandardMessageDto[]): Promise<void> {
      await loadList([row(alice)]);
      const opening = store.open('alice');
      await answerHistory(alice, firstPage);
      await answerUnread(0);
      await opening;
    }

    it('puts the next page above what is shown, and ends on a short page', async () => {
      await openAlice(messages(11, 10 + messageHistoryPageSize, alice));
      expect(store.openConversation()?.historyStatus).toBe(PageLoadStatus.Idle);

      const loadingOlder = store.loadOlderMessages();
      await answerHistory(alice, messages(1, 10, alice), 2);
      await loadingOlder;

      expect(store.openConversation()?.messages).toEqual(
        messages(1, 10 + messageHistoryPageSize, alice),
      );
      expect(store.openConversation()?.historyStatus).toBe(PageLoadStatus.Ended);
    });

    it('shows a message once when the next page repeats it', async () => {
      await openAlice(messages(11, 10 + messageHistoryPageSize, alice));

      const loadingOlder = store.loadOlderMessages();
      await answerHistory(alice, messages(5, 11, alice), 2);
      await loadingOlder;

      expect(store.openConversation()?.messages).toEqual(
        messages(5, 10 + messageHistoryPageSize, alice),
      );
    });

    it('asks for no page after the last one', async () => {
      await openAlice(messages(1, 3, alice));

      await store.loadOlderMessages();

      expect(store.openConversation()?.messages).toEqual(messages(1, 3, alice));
    });

    it('asks for the first page again after it failed', async () => {
      await loadList([row(alice, 1)]);
      const opening = store.open('alice');
      httpTesting
        .expectOne((candidate) => candidate.url === '/api/messages/conversation/3')
        .flush(null, { status: 0, statusText: '' });
      await opening;

      const retrying = store.loadOlderMessages();
      await answerHistory(alice, messages(1, 2, alice));
      await answerUnread(0);
      await retrying;

      expect(store.openConversation()?.messages).toEqual(messages(1, 2, alice));
      expect(store.conversations()[0].unreadCount).toBe(0);
    });
  });

  it('forgets the list and the open conversation when cleared', async () => {
    await loadList([row(alice)]);
    const opening = store.open('alice');
    await answerHistory(alice, []);
    await answerUnread(0);
    await opening;

    store.clear();

    expect(store.conversations()).toEqual([]);
    expect(store.listStatus()).toBe(PageLoadStatus.Idle);
    expect(store.openConversation()).toBeNull();
  });
});
