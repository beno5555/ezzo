import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ToastLook } from '../../shared/toasts/toast-look';
import { ToastPerson } from '../../shared/toasts/toast-person';
import { ToastStore } from '../../shared/toasts/toast-store';
import { FriendPresence } from '../../features/friendships/friend-presence';
import { PresenceStore } from '../../features/friendships/presence-store';
import { OpenConversation } from '../../features/messages/open-conversation';
import { ConversationsStore } from '../../features/messages/conversations-store';
import { PushMessageDto } from '../../features/messages/push-message-dto';
import { english } from '../languages/english';
import { georgian } from '../languages/georgian';
import { LanguageStore } from '../languages/language-store';
import { LiveToastStore } from './live-toast-store';

const fiveMinutes = 5 * 60 * 1000;

const alice: FriendPresence = { id: 3, username: 'alice', lastActiveAt: null };
const aliceAsPerson: ToastPerson = { id: alice.id, username: alice.username };

function pushed(overrides: Partial<PushMessageDto> = {}): PushMessageDto {
  return {
    id: 1,
    content: 'Hello there',
    images: [],
    sender: { id: alice.id, username: alice.username },
    sentAt: '2026-11-17T09:00:00Z',
    ...overrides,
  };
}

describe('LiveToastStore', () => {
  const openConversation = signal<Pick<OpenConversation, 'username' | 'friend'> | null>(null);
  const friends = signal<readonly FriendPresence[]>([]);
  const language = signal<'en' | 'ka'>('en');
  let liveToastStore: LiveToastStore;
  let toastStore: ToastStore;

  function shownToasts() {
    return toastStore.visible().map(({ message, link, look, person }) => ({
      message,
      link,
      look,
      person,
    }));
  }

  beforeEach(() => {
    vi.useFakeTimers();
    openConversation.set(null);
    friends.set([alice]);
    language.set('en');
    TestBed.configureTestingModule({
      providers: [
        { provide: ConversationsStore, useValue: { openConversation } },
        { provide: PresenceStore, useValue: { friends } },
        {
          provide: LanguageStore,
          useValue: { text: () => (language() === 'en' ? english : georgian) },
        },
      ],
    });
    liveToastStore = TestBed.inject(LiveToastStore);
    toastStore = TestBed.inject(ToastStore);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('a message', () => {
    it('shows the friend and the start of the message, and opens that conversation', () => {
      liveToastStore.messageReceived(pushed());

      expect(shownToasts()).toEqual([
        {
          message: 'Hello there',
          link: '/messages/alice',
          look: ToastLook.Message,
          person: aliceAsPerson,
        },
      ]);
    });

    it('shows no toast for the conversation that is open', () => {
      openConversation.set({
        username: 'alice',
        friend: { id: alice.id, username: 'alice', lastActiveAt: null, isActive: true },
      });

      liveToastStore.messageReceived(pushed());

      expect(shownToasts()).toEqual([]);
    });

    it('treats a conversation whose friend is not known yet as open, and ignores the letter case of its address', () => {
      openConversation.set({ username: 'ALICE', friend: null });

      liveToastStore.messageReceived(pushed());

      expect(shownToasts()).toEqual([]);
    });

    it('shows a toast for a message from another friend while a conversation is open', () => {
      openConversation.set({
        username: 'bob',
        friend: { id: 4, username: 'bob', lastActiveAt: null, isActive: true },
      });

      liveToastStore.messageReceived(pushed());

      expect(shownToasts()).toHaveLength(1);
    });

    it('reads "Photo" for a message that has only photos', () => {
      const images = [{ id: 1, address: '/api/images/a.jpg', orderIndex: 0 }];

      liveToastStore.messageReceived(pushed({ content: '', images }));

      expect(shownToasts()[0]).toMatchObject({ message: 'Photo', link: '/messages/alice' });

      toastStore.dismiss(toastStore.visible()[0].id);
      liveToastStore.messageReceived(pushed({ id: 2, content: '  \n ', images }));

      expect(shownToasts()[0]).toMatchObject({ message: 'Photo', link: '/messages/alice' });
    });

    it('shows the text of a message that has photos too', () => {
      const images = [{ id: 1, address: '/api/images/a.jpg', orderIndex: 0 }];

      liveToastStore.messageReceived(pushed({ content: 'Look at this', images }));

      expect(shownToasts()[0].message).toBe('Look at this');
    });

    it('shortens a long message and puts its lines on one line', () => {
      liveToastStore.messageReceived(pushed({ content: `first\nsecond ${'x'.repeat(200)}` }));

      const { message } = shownToasts()[0];

      expect(message.startsWith('first second xxx')).toBe(true);
      expect(message.endsWith('…')).toBe(true);
      expect(message.length).toBeLessThan(100);
    });

    it('shows no toast for a message from an account that is gone', () => {
      liveToastStore.messageReceived(pushed({ sender: { id: null, username: 'account_deleted' } }));

      expect(shownToasts()).toEqual([]);
    });

    it('encodes the username in the link as one address segment', () => {
      liveToastStore.messageReceived(pushed({ sender: { id: 9, username: 'a b/c' } }));

      expect(shownToasts()[0].link).toBe('/messages/a%20b%2Fc');
    });
  });

  describe('a comment', () => {
    it('shows who commented and opens the post', () => {
      liveToastStore.commentReceived({
        id: 5,
        authorId: 4,
        authorUsername: 'bob',
        content: 'Nice',
        postId: 12,
      });

      expect(shownToasts()).toEqual([
        {
          message: 'commented on your post',
          link: '/posts/12',
          look: ToastLook.Comment,
          person: { id: 4, username: 'bob' },
        },
      ]);
    });
  });

  describe('a comment from an account that is gone', () => {
    it('shows no toast, as it has no picture to show', () => {
      liveToastStore.commentReceived({
        id: 5,
        authorId: null,
        authorUsername: 'account_deleted',
        content: 'Nice',
        postId: 12,
      });

      expect(shownToasts()).toEqual([]);
    });
  });

  describe('a like', () => {
    it('shows who liked the post and opens the post', () => {
      liveToastStore.postLiked({
        postId: 12,
        likedBy: { id: 4, username: 'bob' },
        likeCount: 3,
      });

      expect(shownToasts()).toEqual([
        {
          message: 'liked your post',
          link: '/posts/12',
          look: ToastLook.Like,
          person: { id: 4, username: 'bob' },
        },
      ]);
    });

    it('shows no toast for a like from an account that is gone', () => {
      liveToastStore.postLiked({
        postId: 12,
        likedBy: { id: null, username: 'account_deleted' },
        likeCount: 3,
      });

      expect(shownToasts()).toEqual([]);
    });
  });

  describe('a friend coming online', () => {
    it('shows the friend`s name and that they are online, and opens their conversation', () => {
      liveToastStore.friendOnline(alice.id);

      expect(shownToasts()).toEqual([
        {
          message: 'is online',
          link: '/messages/alice',
          look: ToastLook.Online,
          person: aliceAsPerson,
        },
      ]);
    });

    it('shows nothing for a friend whose name the presence store does not hold', () => {
      liveToastStore.friendOnline(99);

      expect(shownToasts()).toEqual([]);
    });

    it('shows no second toast for the same friend within 5 minutes, and one after 5 minutes', () => {
      const show = vi.spyOn(toastStore, 'show');

      liveToastStore.friendOnline(alice.id);
      vi.advanceTimersByTime(fiveMinutes - 1);
      liveToastStore.friendOnline(alice.id);

      expect(show).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1);
      liveToastStore.friendOnline(alice.id);

      expect(show).toHaveBeenCalledTimes(2);
      expect(show).toHaveBeenLastCalledWith('is online', {
        link: '/messages/alice',
        look: ToastLook.Online,
        person: aliceAsPerson,
      });
    });

    it('counts the 5 minutes from the last toast, not from the last event', () => {
      const show = vi.spyOn(toastStore, 'show');

      liveToastStore.friendOnline(alice.id);
      vi.advanceTimersByTime(fiveMinutes - 1000);
      liveToastStore.friendOnline(alice.id); // within 5 minutes: no toast, and the clock is not restarted
      vi.advanceTimersByTime(1000);
      liveToastStore.friendOnline(alice.id);

      expect(show).toHaveBeenCalledTimes(2);
    });

    it('keeps a time for each friend', () => {
      const bob: FriendPresence = { id: 4, username: 'bob', lastActiveAt: null };
      friends.set([alice, bob]);

      liveToastStore.friendOnline(alice.id);
      liveToastStore.friendOnline(bob.id);

      expect(shownToasts().map(({ person }) => person?.username)).toEqual(['alice', 'bob']);
    });

    it('forgets the times on sign-out', () => {
      liveToastStore.friendOnline(alice.id);
      toastStore.dismiss(toastStore.visible()[0].id);

      liveToastStore.clear();
      liveToastStore.friendOnline(alice.id);

      expect(shownToasts()).toHaveLength(1);
    });
  });

  describe('sign-out', () => {
    it('takes down the toasts still on screen, so a message does not show over the next screen', () => {
      liveToastStore.messageReceived(pushed());
      liveToastStore.postLiked({ postId: 12, likedBy: { id: 4, username: 'bob' }, likeCount: 3 });
      expect(shownToasts()).toHaveLength(2);

      liveToastStore.clear();

      expect(shownToasts()).toEqual([]);
    });
  });

  it('writes every toast in the language in use', () => {
    language.set('ka');

    liveToastStore.messageReceived(
      pushed({ content: '', images: [{ id: 1, address: '', orderIndex: 0 }] }),
    );
    liveToastStore.commentReceived({
      id: 5,
      authorId: 4,
      authorUsername: 'bob',
      content: 'Nice',
      postId: 12,
    });
    liveToastStore.postLiked({ postId: 12, likedBy: { id: 4, username: 'bob' }, likeCount: 3 });

    const texts = shownToasts().map(({ message }) => message);

    expect(texts).toEqual([
      georgian.messages.list.photo,
      georgian.shared.toasts.live.comment,
      georgian.shared.toasts.live.like,
    ]);
    expect(texts).not.toContain(english.shared.toasts.live.comment);
  });
});
