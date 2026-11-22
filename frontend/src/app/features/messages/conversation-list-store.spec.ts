import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { waitForPendingWork } from '../../core/session/testing/wait-for-pending-work';
import { DisplayFriendDto } from '../friendships/display-friend-dto';
import { ConversationFriendDto } from './conversation-friend-dto';
import { ConversationListStore } from './conversation-list-store';
import { StandardMessageDto } from './standard-message-dto';

const listAddress = '/api/messages/friends/conversation';

const alice: DisplayFriendDto = { id: 3, username: 'alice', lastActiveAt: null, isActive: true };
const bob: DisplayFriendDto = { id: 4, username: 'bob', lastActiveAt: null, isActive: true };

function row(friend: DisplayFriendDto, lastMessageSentAt: string): ConversationFriendDto {
  return {
    conversationFriend: friend,
    lastMessageContent: `Hi from ${friend.username}`,
    lastMessageSentAt,
    lastMessageSenderId: friend.id,
    lastMessageImageCount: 0,
    unreadCount: 0,
  };
}

function messageFrom(friend: DisplayFriendDto, sentAt: string): StandardMessageDto {
  return {
    id: 50,
    content: 'a new message',
    images: [],
    sender: { id: friend.id, username: friend.username },
    receiverId: 1,
    sentAt,
    seen: false,
    seenAt: null,
    isEdited: false,
  };
}

const listEnvelope = (data: ConversationFriendDto[]) => ({
  succeeded: true,
  message: null,
  data,
  totalCount: 0,
});

describe('ConversationListStore', () => {
  let store: ConversationListStore;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(ConversationListStore);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  async function answerList(rows: ConversationFriendDto[]): Promise<void> {
    httpTesting.expectOne((request) => request.url === listAddress).flush(listEnvelope(rows));
    await waitForPendingWork();
  }

  async function loadList(rows: ConversationFriendDto[]): Promise<void> {
    const loading = store.load();
    await answerList(rows);
    await loading;
  }

  describe('refresh', () => {
    it('reads the list again instead of applying an answer a message made out of date', async () => {
      await loadList([row(alice, '2026-11-17T09:00:00Z')]);

      const refreshing = store.refresh();
      // A message from a new friend arrives while the answer is on its way.
      store.putOnTop(bob, messageFrom(bob, '2026-11-17T10:00:00Z'), bob.id, (count) => count + 1);
      await answerList([row(alice, '2026-11-17T09:00:00Z')]); // read before the message: no row for bob
      await answerList([row(bob, '2026-11-17T10:00:00Z'), row(alice, '2026-11-17T09:00:00Z')]);
      await refreshing;

      expect(store.conversations().map((shown) => shown.conversationFriend.id)).toEqual([
        bob.id,
        alice.id,
      ]);
    });

    it('gives up after a few reads when messages keep changing the list', async () => {
      await loadList([row(alice, '2026-11-17T09:00:00Z')]);

      const refreshing = store.refresh();
      for (let attempt = 0; attempt < 3; attempt++) {
        store.putOnTop(bob, messageFrom(bob, '2026-11-17T10:00:00Z'), bob.id, (count) => count);
        await answerList([row(alice, '2026-11-17T09:00:00Z')]);
      }
      await refreshing;

      // Nothing out of date was applied: the row the message made is still there.
      expect(store.conversations().map((shown) => shown.conversationFriend.id)).toEqual([
        bob.id,
        alice.id,
      ]);
    });

    it('keeps the rows most recent first when a last message got older', async () => {
      await loadList([row(alice, '2026-11-17T09:00:00Z'), row(bob, '2026-11-17T08:30:00Z')]);

      const refreshing = store.refresh();
      await answerList([row(bob, '2026-11-17T08:30:00Z'), row(alice, '2026-11-17T08:00:00Z')]);
      await refreshing;

      expect(store.conversations().map((shown) => shown.conversationFriend.id)).toEqual([
        bob.id,
        alice.id,
      ]);
    });
  });

  describe('friendOf', () => {
    it('finds a listed friend by username, and never matches a placeholder name', async () => {
      const gone: DisplayFriendDto = { ...bob, username: 'account_deleted' };
      await loadList([row(alice, '2026-11-17T09:00:00Z'), row(gone, '2026-11-17T08:00:00Z')]);

      expect(store.friendOf('alice')?.id).toBe(alice.id);
      expect(store.friendOf('nobody')).toBeNull();
      expect(store.friendOf('account_deleted')).toBeNull();
    });
  });
});
