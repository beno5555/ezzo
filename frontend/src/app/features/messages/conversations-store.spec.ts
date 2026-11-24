import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PageLoadStatus } from '../../core/paging/page-load-status';
import { SessionStore } from '../../core/session/session-store';
import { waitForPendingWork } from '../../core/session/testing/wait-for-pending-work';
import { english } from '../../core/languages/english';
import { ConfirmationOpener } from '../../shared/confirmation/confirmation-opener';
import {
  deleteFadeMilliseconds,
  deleteNoticeMinimumMilliseconds,
} from '../../shared/fade-out/delete-fade';
import { PreviewAddressMaker } from '../../shared/photos/preview-address-maker';
import { ToastStore } from '../../shared/toasts/toast-store';
import { AcceptedFriendshipDto } from '../friendships/accepted-friendship-dto';
import { DisplayFriendDto } from '../friendships/display-friend-dto';
import { PresenceStore } from '../friendships/presence-store';
import { StandardUserDto } from '../users/standard-user-dto';
import { ConversationFriendDto } from './conversation-friend-dto';
import { ConversationOpenStatus } from './conversation-open-status';
import { ConversationListStore, conversationListPageSize } from './conversation-list-store';
import { ConversationsStore, messageHistoryPageSize } from './conversations-store';
import { PushMessageDto } from './push-message-dto';
import { SentMessageDto } from './sent-message-dto';
import { StandardMessageDto } from './standard-message-dto';
import { TypingStore } from './typing-store';
import { UnreadStore } from './unread-store';

// How long a deletion takes when the server answers at once: the notice's minimum, then the fade.
const settleMilliseconds = deleteNoticeMinimumMilliseconds + deleteFadeMilliseconds;
const signedInUserId = 1;
const signedInUsername = 'me';
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
  let conversationListStore: ConversationListStore;
  let presenceStore: PresenceStore;
  let unreadStore: UnreadStore;
  let toastStore: ToastStore;
  let httpTesting: HttpTestingController;
  // Preview addresses named after their file, and a record of those released.
  let previews: { released: string[] };

  // Answers the confirmation of a deletion; the dialog itself is not under test here.
  const confirmation = { ask: vi.fn() };

  beforeEach(() => {
    confirmation.ask.mockReset();
    confirmation.ask.mockResolvedValue(true);
    previews = { released: [] };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: SessionStore,
          useValue: {
            userId: signal(signedInUserId),
            user: signal({ id: signedInUserId, username: signedInUsername, roles: [] }),
          },
        },
        {
          provide: PreviewAddressMaker,
          useValue: {
            create: (photo: File) => `blob:${photo.name}`,
            release: (address: string) => previews.released.push(address),
          },
        },
        { provide: ConfirmationOpener, useValue: confirmation },
      ],
    });
    store = TestBed.inject(ConversationsStore);
    conversationListStore = TestBed.inject(ConversationListStore);
    presenceStore = TestBed.inject(PresenceStore);
    unreadStore = TestBed.inject(UnreadStore);
    toastStore = TestBed.inject(ToastStore);
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
    const loading = conversationListStore.load();
    await answerList(rows);
    await loading;
  }

  describe('the conversation list', () => {
    it('loads the first page, and ends when the page is shorter than the page size', async () => {
      await loadList([row(alice, 2), row(bob)]);

      expect(conversationListStore.conversations()).toEqual([row(alice, 2), row(bob)]);
      expect(conversationListStore.status()).toBe(PageLoadStatus.Ended);
    });

    it('appends the next page while the pages are full', async () => {
      const fullPage = Array.from({ length: conversationListPageSize }, (_, index) =>
        row({ ...bob, id: 100 + index, username: `friend${index}` }),
      );
      await loadList(fullPage);
      expect(conversationListStore.status()).toBe(PageLoadStatus.Idle);

      const loadingMore = conversationListStore.loadMore();
      await answerList([row(alice)], 2);
      await loadingMore;

      expect(conversationListStore.conversations()).toEqual([...fullPage, row(alice)]);
      expect(conversationListStore.status()).toBe(PageLoadStatus.Ended);
    });

    it('starts again from the first page when loaded again', async () => {
      await loadList([row(alice, 2)]);

      await loadList([row(bob), row(alice)]);

      expect(conversationListStore.conversations()).toEqual([row(bob), row(alice)]);
    });

    it('keeps the rows and says why when a page fails', async () => {
      await loadList([row(alice)]);

      const failing = conversationListStore.load();
      httpTesting
        .expectOne((candidate) => candidate.url === listAddress)
        .flush(null, {
          status: 0,
          statusText: 'Unknown Error',
        });
      await failing;

      expect(conversationListStore.conversations()).toEqual([row(alice)]);
      expect(conversationListStore.status()).toBe(PageLoadStatus.Failed);
      expect(conversationListStore.failure()).not.toBeNull();
    });

    it('changes a row when its friend goes offline or comes online', async () => {
      await loadList([row(alice), row(bob)]);

      presenceStore.markOffline(alice.id, '2026-11-17T10:00:00Z');
      await presenceStore.markOnline(bob.id);

      const [aliceRow, bobRow] = conversationListStore.conversations();
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
        sendingIds: new Set(),
        waitingIds: new Set(),
        fadingIds: new Set(),
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
      expect(conversationListStore.conversations()[0].unreadCount).toBe(2);
    });
  });

  describe('marking the conversation read', () => {
    it('clears the row count and reads the unread number again once the history arrives', async () => {
      await loadList([row(alice, 2), row(bob, 1)]);

      const opening = store.open('alice');
      await answerHistory(alice, messages(1, 2, alice));
      await answerUnread(1);
      await opening;

      expect(conversationListStore.conversations().map((shown) => shown.unreadCount)).toEqual([
        0, 1,
      ]);
      expect(unreadStore.count()).toBe(1);
    });

    it('keeps the count cleared when the list arrives after the conversation was read', async () => {
      const listLoading = conversationListStore.load();
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

      expect(conversationListStore.conversations().map((shown) => shown.unreadCount)).toEqual([
        0, 1,
      ]);
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
      expect(conversationListStore.conversations()[0].unreadCount).toBe(2);
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
      expect(conversationListStore.conversations()[0].unreadCount).toBe(0);
    });
  });

  describe('sending a message', () => {
    const lake = new File(['lake'], 'lake.jpg', { type: 'image/jpeg' });
    const sendAddress = `/api/messages/${bob.id}`;

    function sentCopy(id: number, content: string, images = 0): SentMessageDto {
      return {
        id,
        content,
        images: Array.from({ length: images }, (_, index) => ({
          id: 100 + index,
          address: `/api/images/${id}-${index}.jpg`,
          orderIndex: index,
        })),
        sentAt: '2026-11-22T10:00:00Z',
      };
    }

    function ownCopy(sent: SentMessageDto, seenAt: string | null = null): StandardMessageDto {
      return {
        ...sent,
        sender: { id: signedInUserId, username: signedInUsername },
        receiverId: bob.id,
        seen: seenAt !== null,
        seenAt,
        isEdited: false,
      };
    }

    async function openBob(rows: ConversationFriendDto[], history: StandardMessageDto[] = []) {
      await loadList(rows);
      const opening = store.open('bob');
      await answerHistory(bob, history);
      await answerUnread(0);
      await opening;
    }

    it('shows the message at once as sending, with the previews, then the server copy in its place', async () => {
      await openBob([row(alice), row(bob)], messages(1, 2, bob));

      const sending = store.send({ content: 'Look', photos: [lake] });

      const shown = store.openConversation();
      const pending = shown?.messages.at(-1);
      expect(shown?.messages).toHaveLength(3);
      expect(pending).toMatchObject({
        content: 'Look',
        images: [{ address: 'blob:lake.jpg', orderIndex: 0 }],
        sender: { id: signedInUserId, username: signedInUsername },
        receiverId: bob.id,
        seen: false,
      });
      expect(pending?.id).toBeLessThan(0);
      expect(shown?.sendingIds.has(pending?.id ?? 0)).toBe(true);

      httpTesting.expectOne(sendAddress).flush(envelope(sentCopy(40, 'Look', 1)));
      await sending;

      expect(store.openConversation()?.messages).toEqual([
        ...messages(1, 2, bob),
        ownCopy(sentCopy(40, 'Look', 1)),
      ]);
      expect(store.openConversation()?.sendingIds.size).toBe(0);
      expect(previews.released).toEqual(['blob:lake.jpg']);
    });

    it('moves the conversation to the top of the list with the new last message', async () => {
      await openBob([row(alice), row(bob)]);

      const sending = store.send({ content: '', photos: [lake] });
      httpTesting.expectOne(sendAddress).flush(envelope(sentCopy(40, '', 1)));
      await sending;

      expect(conversationListStore.conversations()[0]).toEqual({
        conversationFriend: bob,
        lastMessageContent: '',
        lastMessageSentAt: '2026-11-22T10:00:00Z',
        lastMessageSenderId: signedInUserId,
        lastMessageImageCount: 1,
        unreadCount: 0,
      });
      expect(conversationListStore.conversations()[1]).toEqual(row(alice));
    });

    it('puts a first message’s conversation on top of the list', async () => {
      await loadList([row(alice)]);
      const opening = store.open('bob');
      httpTesting.expectOne('/api/users/bob').flush(envelope(user(bob)));
      await waitForPendingWork();
      httpTesting.expectOne('/api/friendships/accepted/4').flush(envelope(friendship(bob)));
      await waitForPendingWork();
      await answerHistory(bob, []);
      await answerUnread(0);
      await opening;

      const sending = store.send({ content: 'Hello', photos: [] });
      httpTesting.expectOne(sendAddress).flush(envelope(sentCopy(40, 'Hello')));
      await sending;

      expect(
        conversationListStore.conversations().map((shown) => shown.conversationFriend.id),
      ).toEqual([bob.id, alice.id]);
    });

    it('removes a refused message, says why, and keeps its text and photos for the box', async () => {
      await openBob([row(bob)], messages(1, 2, bob));

      const sending = store.send({ content: 'Look', photos: [lake] });
      httpTesting
        .expectOne(sendAddress)
        .flush(
          { succeeded: false, message: 'You can message only your friends', data: null },
          { status: 400, statusText: 'Bad Request' },
        );
      await sending;

      expect(store.openConversation()?.messages).toEqual(messages(1, 2, bob));
      expect(toastStore.visible().map((toast) => toast.message)).toEqual([
        'You can message only your friends',
      ]);
      expect(conversationListStore.conversations()).toEqual([row(bob)]);
      expect(store.returnedMessage()).toEqual({ content: 'Look', photos: [lake] });
      expect(store.takeReturned()).toEqual({ content: 'Look', photos: [lake] });
      expect(store.returnedMessage()).toBeNull();
    });

    it('keeps a refused message for its own conversation only', async () => {
      await openBob([row(alice), row(bob)]);
      const sending = store.send({ content: 'Look', photos: [] });
      const openingAlice = store.open('alice');
      await answerHistory(alice, []);
      await answerUnread(0);
      await openingAlice;

      httpTesting
        .expectOne(sendAddress)
        .flush({ succeeded: false, message: 'Refused' }, { status: 400, statusText: '' });
      await sending;

      expect(store.returnedMessage()).toBeNull();
      const openingBob = store.open('bob');
      await answerHistory(bob, []);
      await answerUnread(0);
      await openingBob;
      expect(store.returnedMessage()).toEqual({ content: 'Look', photos: [] });
    });

    it('shows the server copy as seen when the friend read it before the answer arrived', async () => {
      await openBob([row(bob)]);

      const sending = store.send({ content: 'Quick', photos: [] });
      store.markSeen({ seenBy: bob.id, seenAt: '2026-11-22T10:00:05Z' });
      httpTesting.expectOne(sendAddress).flush(envelope(sentCopy(40, 'Quick')));
      await sending;

      expect(store.openConversation()?.messages).toEqual([
        ownCopy(sentCopy(40, 'Quick'), '2026-11-22T10:00:05Z'),
      ]);
    });
  });

  describe('a message that arrives', () => {
    function push(id: number, sender: DisplayFriendDto, content = `pushed ${id}`): PushMessageDto {
      return {
        id,
        content,
        images: [],
        sender: { id: sender.id, username: sender.username },
        sentAt: '2026-11-22T11:00:00Z',
      };
    }

    function asHistory(pushed: PushMessageDto): StandardMessageDto {
      return {
        ...pushed,
        receiverId: signedInUserId,
        seen: false,
        seenAt: null,
        isEdited: false,
      };
    }

    it('joins the open conversation, which is marked read again', async () => {
      await loadList([row(bob), row(alice)]);
      const opening = store.open('alice');
      await answerHistory(alice, messages(1, 2, alice));
      await answerUnread(0);
      await opening;

      const receiving = store.receive(push(50, alice, 'Are you there?'));

      expect(store.openConversation()?.messages).toEqual([
        ...messages(1, 2, alice),
        asHistory(push(50, alice, 'Are you there?')),
      ]);
      httpTesting
        .expectOne(
          (candidate) =>
            candidate.method === 'PUT' &&
            candidate.url === `/api/messages/conversation/${alice.id}/mark-as-read`,
        )
        .flush(null, { status: 204, statusText: 'No Content' });
      await waitForPendingWork();
      await answerUnread(0);
      await receiving;

      expect(conversationListStore.conversations()[0]).toMatchObject({
        conversationFriend: alice,
        lastMessageContent: 'Are you there?',
        lastMessageSenderId: alice.id,
        unreadCount: 0,
      });
    });

    it('moves a closed conversation to the top with a higher count, and reads the unread number again', async () => {
      await loadList([row(alice), row(bob, 1)]);

      const receiving = store.receive(push(50, bob, 'Ping'));
      await answerUnread(2);
      await receiving;

      expect(conversationListStore.conversations()).toEqual([
        {
          conversationFriend: bob,
          lastMessageContent: 'Ping',
          lastMessageSentAt: '2026-11-22T11:00:00Z',
          lastMessageSenderId: bob.id,
          lastMessageImageCount: 0,
          unreadCount: 2,
        },
        row(alice),
      ]);
      expect(unreadStore.count()).toBe(2);
    });

    it('adds a row on top for a conversation the list does not hold', async () => {
      const carol: DisplayFriendDto = {
        id: 5,
        username: 'carol',
        lastActiveAt: null,
        isActive: true,
      };
      await loadList([row(alice)]);

      const receiving = store.receive(push(50, carol, 'Hi, it is Carol'));
      await answerUnread(1);
      await receiving;

      expect(conversationListStore.conversations()[0]).toEqual({
        conversationFriend: carol,
        lastMessageContent: 'Hi, it is Carol',
        lastMessageSentAt: '2026-11-22T11:00:00Z',
        lastMessageSenderId: carol.id,
        lastMessageImageCount: 0,
        unreadCount: 1,
      });
      expect(conversationListStore.conversations()).toHaveLength(2);
    });

    it('does not show a message twice', async () => {
      await loadList([row(alice)]);
      const opening = store.open('alice');
      await answerHistory(alice, messages(1, 2, alice));
      await answerUnread(0);
      await opening;

      const receiving = store.receive({ ...push(2, alice), content: 'message 2' });
      httpTesting
        .expectOne(`/api/messages/conversation/${alice.id}/mark-as-read`)
        .flush(null, { status: 204, statusText: 'No Content' });
      await waitForPendingWork();
      await answerUnread(0);
      await receiving;

      expect(store.openConversation()?.messages.map((shown) => shown.id)).toEqual([1, 2]);
    });
  });

  describe('seen', () => {
    function own(id: number, to: DisplayFriendDto): StandardMessageDto {
      return {
        ...message(id, alice),
        sender: { id: signedInUserId, username: signedInUsername },
        receiverId: to.id,
        seen: false,
        seenAt: null,
      };
    }

    it('marks the user’s messages to that friend as seen', async () => {
      await loadList([row(alice)]);
      const opening = store.open('alice');
      await answerHistory(alice, [own(1, alice), message(2, alice), own(3, alice)]);
      await answerUnread(0);
      await opening;

      store.markSeen({ seenBy: alice.id, seenAt: '2026-11-22T12:00:00Z' });

      expect(store.openConversation()?.messages).toEqual([
        { ...own(1, alice), seen: true, seenAt: '2026-11-22T12:00:00Z' },
        message(2, alice),
        { ...own(3, alice), seen: true, seenAt: '2026-11-22T12:00:00Z' },
      ]);
    });

    it('leaves a message sent after the friend read the conversation unseen', async () => {
      const later = { ...own(2, alice), sentAt: '2026-11-22T12:05:00Z' };
      await loadList([row(alice)]);
      const opening = store.open('alice');
      await answerHistory(alice, [own(1, alice), later]);
      await answerUnread(0);
      await opening;

      store.markSeen({ seenBy: alice.id, seenAt: '2026-11-22T12:00:00Z' });

      expect(store.openConversation()?.messages).toEqual([
        { ...own(1, alice), seen: true, seenAt: '2026-11-22T12:00:00Z' },
        later,
      ]);
    });

    it('changes nothing when another friend read their messages', async () => {
      await loadList([row(alice)]);
      const opening = store.open('alice');
      await answerHistory(alice, [own(1, alice)]);
      await answerUnread(0);
      await opening;

      store.markSeen({ seenBy: bob.id, seenAt: '2026-11-22T12:00:00Z' });

      expect(store.openConversation()?.messages).toEqual([own(1, alice)]);
    });
  });

  describe('editing and deleting the user’s own messages', () => {
    const messageAddress = (id: number) => `/api/messages/${id}`;
    const lastOfRow = () => conversationListStore.conversations()[0].lastMessageContent;
    const toastMessages = () => toastStore.visible().map((toast) => toast.message);

    function mine(id: number, content: string): StandardMessageDto {
      return {
        ...message(id, alice),
        content,
        sender: { id: signedInUserId, username: signedInUsername },
        receiverId: alice.id,
        seen: false,
        seenAt: null,
      };
    }

    async function openAlice(history: StandardMessageDto[]): Promise<void> {
      await loadList([row(alice), row(bob)]);
      const opening = store.open('alice');
      await answerHistory(alice, history);
      await answerUnread(0);
      await opening;
    }

    describe('edit', () => {
      afterEach(() => {
        vi.useRealTimers();
      });

      it('shows the new text at once as edited, with the clock, then the server copy in its place', async () => {
        await openAlice([mine(1, 'first'), mine(2, 'Helo')]);

        const editing = store.edit(mine(2, 'Helo'), 'Hello');

        const shown = store.openConversation();
        expect(shown?.messages.at(-1)).toMatchObject({ id: 2, content: 'Hello', isEdited: true });
        expect(shown?.sendingIds.has(2)).toBe(true);

        const request = httpTesting.expectOne(messageAddress(2));
        expect(request.request.method).toBe('PUT');
        expect(request.request.body).toEqual({ newContent: 'Hello' });
        const serverCopy = { ...mine(2, 'Hello'), isEdited: true };
        request.flush(envelope(serverCopy));
        await editing;

        expect(store.openConversation()?.messages.at(-1)).toEqual(serverCopy);
        expect(store.openConversation()?.sendingIds.size).toBe(0);
      });

      it('puts the old text back, shows the refusal and keeps what was written, when the server refuses', async () => {
        await openAlice([mine(1, 'first'), mine(2, 'Helo')]);

        const editing = store.edit(mine(2, 'Helo'), 'Hello');
        httpTesting
          .expectOne(messageAddress(2))
          .flush(
            { succeeded: false, message: 'Message edit window has expired' },
            { status: 400, statusText: 'Bad Request' },
          );
        await editing;

        expect(store.openConversation()?.messages.at(-1)).toEqual(mine(2, 'Helo'));
        expect(store.openConversation()?.sendingIds.size).toBe(0);
        expect(toastMessages()).toEqual(['Message edit window has expired']);
        expect(store.editDraft()).toEqual({ message: mine(2, 'Helo'), content: 'Hello' });
      });

      it('holds the message’s text for the message box from startEditing until the edit ends', async () => {
        await openAlice([mine(1, 'first'), mine(2, 'Helo')]);

        store.startEditing(mine(2, 'Helo'));
        expect(store.editDraft()).toEqual({ message: mine(2, 'Helo'), content: 'Helo' });

        store.stopEditing();
        expect(store.editDraft()).toBeNull();

        store.startEditing(mine(2, 'Helo'));
        const editing = store.edit(mine(2, 'Helo'), 'Hello');
        expect(store.editDraft()).toBeNull();
        httpTesting.expectOne(messageAddress(2)).flush(envelope(mine(2, 'Hello')));
        await editing;
        expect(store.editDraft()).toBeNull();
      });

      it('drops the edit when the conversation closes, and does not bring a refused edit back over a newer one', async () => {
        await openAlice([mine(1, 'first'), mine(2, 'Helo')]);

        store.startEditing(mine(2, 'Helo'));
        store.close();
        expect(store.editDraft()).toBeNull();

        await openAlice([mine(1, 'first'), mine(2, 'Helo')]);
        const editing = store.edit(mine(2, 'Helo'), 'Hello');
        store.startEditing(mine(1, 'first'));
        httpTesting
          .expectOne(messageAddress(2))
          .flush(
            { succeeded: false, message: 'Message edit window has expired' },
            { status: 400, statusText: 'Bad Request' },
          );
        await editing;

        expect(store.editDraft()?.message.id).toBe(1);
      });

      it('shows the last message in the row, whether the edited message is the last one or not', async () => {
        await openAlice([mine(1, 'first'), mine(2, 'Helo')]);

        const editingFirst = store.edit(mine(1, 'first'), 'first!');
        httpTesting.expectOne(messageAddress(1)).flush(envelope(mine(1, 'first!')));
        await editingFirst;
        const rowAfterFirst = lastOfRow();
        const editingLast = store.edit(mine(2, 'Helo'), 'Hello');

        // The edit of an earlier message leaves the last message as it is.
        expect(rowAfterFirst).toBe('Helo');
        expect(lastOfRow()).toBe('Hello');
        httpTesting.expectOne(messageAddress(2)).flush(envelope(mine(2, 'Hello')));
        await editingLast;
        expect(lastOfRow()).toBe('Hello');
      });

      it('sends one request for a message whose edit is on its way', async () => {
        await openAlice([mine(2, 'Helo')]);

        const first = store.edit(mine(2, 'Helo'), 'Hello');
        const second = store.edit(mine(2, 'Helo'), 'Hullo');

        httpTesting.expectOne(messageAddress(2)).flush(envelope(mine(2, 'Hello')));
        await Promise.all([first, second]);
        expect(store.openConversation()?.messages[0].content).toBe('Hello');
      });
    });

    describe('the friend’s edit (MessageEdited)', () => {
      it('changes the message in the open conversation and marks it edited', async () => {
        await openAlice([message(1, alice), message(2, alice)]);

        await store.markEdited({ id: 1, content: 'changed' });

        expect(store.openConversation()?.messages[0]).toMatchObject({
          id: 1,
          content: 'changed',
          isEdited: true,
        });
        // The row shows message 2, the last one, which was not edited.
        expect(lastOfRow()).toBe('message 2');
      });

      it('changes the row too when the message is the last one', async () => {
        await openAlice([message(1, alice), message(2, alice)]);

        await store.markEdited({ id: 2, content: 'changed' });

        expect(lastOfRow()).toBe('changed');
      });

      it('reads the first page of the list again for a message the open conversation does not hold, and keeps the other rows', async () => {
        await loadList([row(alice), row(bob)]);
        const changedBob = { ...row(bob), lastMessageContent: 'edited by bob' };

        const marking = store.markEdited({ id: 90, content: 'edited by bob' });
        await answerList([row(alice), changedBob]);
        await marking;

        expect(
          conversationListStore.conversations().map((shown) => shown.lastMessageContent),
        ).toEqual(['Hi from alice', 'edited by bob']);
      });

      it('asks the backend for nothing when the list was never loaded', async () => {
        await store.markEdited({ id: 90, content: 'edited' });

        expect(conversationListStore.conversations()).toEqual([]);
      });
    });

    describe('the friend’s deletion (MessageDeleted)', () => {
      it('drops the message from the open conversation at once, and the row shows the new last message', async () => {
        await openAlice([message(1, alice), message(2, alice)]);

        const marking = store.markDeleted({ id: 2 });
        await marking;

        expect(store.openConversation()?.messages.map((shown) => shown.id)).toEqual([1]);
        expect(lastOfRow()).toBe('message 1');
        expect(store.openConversation()?.fadingIds.size).toBe(0);
      });

      it('removes the row when the open conversation has no message left', async () => {
        await openAlice([message(1, alice)]);

        await store.markDeleted({ id: 1 });

        expect(
          conversationListStore.conversations().map((shown) => shown.conversationFriend.id),
        ).toEqual([bob.id]);
      });

      it('reads the list and the unread count again for a message the open conversation does not hold', async () => {
        await loadList([row(alice), row(bob)]);
        const changedBob = { ...row(bob), lastMessageContent: 'the one before' };

        const marking = store.markDeleted({ id: 90 });
        await answerList([row(alice), changedBob]);
        await answerUnread(1);
        await marking;

        expect(
          conversationListStore.conversations().map((shown) => shown.lastMessageContent),
        ).toEqual(['Hi from alice', 'the one before']);
      });

      it('drops the row of a conversation the whole list no longer holds', async () => {
        await loadList([row(alice), row(bob)]);

        const marking = store.markDeleted({ id: 90 });
        await answerList([row(bob)]);
        await answerUnread(0);
        await marking;

        expect(
          conversationListStore.conversations().map((shown) => shown.conversationFriend.id),
        ).toEqual([bob.id]);
      });

      it('reads only the unread count when the list was never loaded', async () => {
        const marking = store.markDeleted({ id: 90 });
        await answerUnread(0);
        await marking;

        expect(conversationListStore.conversations()).toEqual([]);
      });

      it('shows a conversation whose last message got older where its time puts it', async () => {
        await loadList([row(alice), { ...row(bob), lastMessageSentAt: '2026-11-17T08:30:00Z' }]);
        const opening = store.open('alice');
        await answerHistory(alice, [
          { ...message(1, alice), sentAt: '2026-11-17T08:00:00Z' },
          message(2, alice),
        ]);
        await answerUnread(0);
        await opening;

        await store.markDeleted({ id: 2 });

        expect(
          conversationListStore.conversations().map((shown) => shown.conversationFriend.id),
        ).toEqual([bob.id, alice.id]);
      });
    });

    describe('delete', () => {
      beforeEach(async () => {
        await openAlice([mine(1, 'first'), mine(2, 'second')]);
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('asks first, and does nothing when the answer is no', async () => {
        confirmation.ask.mockResolvedValue(false);

        await store.deleteMessage(mine(2, 'second'));

        expect(confirmation.ask).toHaveBeenCalledWith(
          expect.objectContaining({
            question: english.messages.deleteConfirmation.question,
            isDestructive: true,
          }),
        );
        expect(store.openConversation()?.messages).toHaveLength(2);
        expect(store.openConversation()?.fadingIds.size).toBe(0);
      });

      it('says "Deleting…" until the server answers, then fades the message out and the row shows the new last message', async () => {
        const rowBefore = lastOfRow();
        const deleting = store.deleteMessage(mine(2, 'second'));
        await vi.advanceTimersByTimeAsync(deleteNoticeMinimumMilliseconds * 5);

        expect(store.openConversation()?.messages).toHaveLength(2);
        expect(store.openConversation()?.waitingIds.has(2)).toBe(true);
        expect(store.openConversation()?.fadingIds.size).toBe(0);
        expect(lastOfRow()).toBe(rowBefore);
        const request = httpTesting.expectOne(messageAddress(2));
        expect(request.request.method).toBe('DELETE');

        request.flush(envelope(null));
        await vi.advanceTimersByTimeAsync(0);

        expect(store.openConversation()?.waitingIds.size).toBe(0);
        expect(store.openConversation()?.fadingIds.has(2)).toBe(true);
        expect(store.openConversation()?.messages).toHaveLength(2);

        await vi.advanceTimersByTimeAsync(deleteFadeMilliseconds);
        await deleting;

        expect(store.openConversation()?.messages.map((shown) => shown.id)).toEqual([1]);
        expect(store.openConversation()?.fadingIds.size).toBe(0);
        expect(lastOfRow()).toBe('first');
        expect(toastMessages()).toEqual([english.messages.deletedToast]);
      });

      it('keeps the message and the row’s last message, and shows the refusal, when the server refuses', async () => {
        const rowBefore = lastOfRow();
        const deleting = store.deleteMessage(mine(2, 'second'));
        await vi.advanceTimersByTimeAsync(0);
        httpTesting
          .expectOne(messageAddress(2))
          .flush(
            { succeeded: false, message: 'Delete request declined' },
            { status: 400, statusText: 'Bad Request' },
          );
        await vi.advanceTimersByTimeAsync(deleteNoticeMinimumMilliseconds);
        await deleting;

        expect(store.openConversation()?.messages.map((shown) => shown.id)).toEqual([1, 2]);
        expect(store.openConversation()?.waitingIds.size).toBe(0);
        expect(store.openConversation()?.fadingIds.size).toBe(0);
        expect(lastOfRow()).toBe(rowBefore);
        expect(toastMessages()).toEqual(['Delete request declined']);
      });

      it('reads the list again, so the row of the message’s conversation shows its new last message, when the reader opened another conversation meanwhile', async () => {
        const deleting = store.deleteMessage(mine(2, 'second'));
        await vi.advanceTimersByTimeAsync(0);
        const opening = store.open('bob');
        await vi.advanceTimersByTimeAsync(0);
        httpTesting
          .expectOne(
            (candidate) =>
              candidate.url === `/api/messages/conversation/${bob.id}` &&
              candidate.params.get('pageNumber') === '1',
          )
          .flush(listEnvelope([]));
        await vi.advanceTimersByTimeAsync(0);
        httpTesting.expectOne(unreadAddress).flush({ unreadCount: 0 });
        await vi.advanceTimersByTimeAsync(0);
        await opening;
        httpTesting.expectOne(messageAddress(2)).flush(envelope(null));
        await vi.advanceTimersByTimeAsync(settleMilliseconds);

        const refresh = httpTesting.expectOne(
          (candidate) =>
            candidate.url === listAddress && candidate.params.get('pageNumber') === '1',
        );
        refresh.flush(listEnvelope([{ ...row(alice), lastMessageContent: 'first' }, row(bob)]));
        await vi.advanceTimersByTimeAsync(0);
        await deleting;

        expect(conversationListStore.conversations()[0].lastMessageContent).toBe('first');
        expect(toastMessages()).toEqual([english.messages.deletedToast]);
      });

      it('removes the row when the conversation has no message left', async () => {
        const deleting = store.deleteMessage(mine(1, 'first'));
        await vi.advanceTimersByTimeAsync(0);
        httpTesting.expectOne(messageAddress(1)).flush(envelope(null));
        await vi.advanceTimersByTimeAsync(settleMilliseconds);
        await deleting;
        const deletingLast = store.deleteMessage(mine(2, 'second'));
        await vi.advanceTimersByTimeAsync(0);
        httpTesting.expectOne(messageAddress(2)).flush(envelope(null));
        await vi.advanceTimersByTimeAsync(settleMilliseconds);
        await deletingLast;

        expect(
          conversationListStore.conversations().map((shown) => shown.conversationFriend.id),
        ).toEqual([bob.id]);
      });
    });
  });

  describe('typing', () => {
    it('hides the friend’s "typing…" when their message arrives', async () => {
      await loadList([row(alice)]);
      const typingStore = TestBed.inject(TypingStore);
      typingStore.userTyping({ userId: alice.id });

      const receiving = store.receive({
        id: 60,
        content: 'Done writing',
        images: [],
        sender: { id: alice.id, username: alice.username },
        sentAt: '2026-11-22T11:00:00Z',
      });
      await answerUnread(1);
      await receiving;

      expect(typingStore.isTyping(alice.id)).toBe(false);
    });
  });

  it('forgets the list and the open conversation when cleared', async () => {
    await loadList([row(alice)]);
    const opening = store.open('alice');
    await answerHistory(alice, []);
    await answerUnread(0);
    await opening;

    store.clear();

    expect(conversationListStore.conversations()).toEqual([]);
    expect(conversationListStore.status()).toBe(PageLoadStatus.Idle);
    expect(store.openConversation()).toBeNull();
  });
});
