import { TestBed } from '@angular/core/testing';
import { AppResult, fail, ok } from '../../core/http/app-result';
import { PageQuery } from '../../core/http/page-query';
import { PageLoadStatus } from '../../core/paging/page-load-status';
import { ConfirmationOpener } from '../../shared/confirmation/confirmation-opener';
import {
  deleteFadeMilliseconds,
  deleteNoticeMinimumMilliseconds,
} from '../../shared/fade-out/delete-fade';
import { ToastStore } from '../../shared/toasts/toast-store';
import { FriendshipAction } from './friendship-action';
import { FriendshipApi } from './friendship-api';
import { FriendsPageStore } from './friends-page-store';
import { FriendsTab } from './friends-tab';
import { IncomingRequestsStore } from './incoming-requests-store';
import { StandardFriendshipDto } from './standard-friendship-dto';

const refusal = fail<never>('Pending request not found', 400);

function row(id: number, status: StandardFriendshipDto['status']): StandardFriendshipDto {
  return {
    otherUser: { id, username: `user_${id}` },
    status,
    sentAt: '2026-11-21T10:00:00Z',
    lastUpdatedAt: null,
    isRequester: false,
  };
}

// A FriendshipApi whose lists the test fills, whose actions it answers one at a time, and a record of the calls.
function createFriendshipApi() {
  const calls: string[] = [];
  const answers: ((result: AppResult<unknown>) => void)[] = [];
  const pages: Record<FriendsTab, StandardFriendshipDto[]> = {
    friends: [],
    incoming: [],
    sent: [],
  };
  const asked = (call: string) =>
    new Promise<AppResult<never>>((resolve) => {
      calls.push(call);
      answers.push(resolve as (result: AppResult<unknown>) => void);
    });
  const read = (tab: FriendsTab) => async (query: PageQuery) => {
    calls.push(`read ${tab} ${query.pageNumber}`);

    return ok(pages[tab]);
  };

  return {
    calls,
    pages,
    answer: (result: AppResult<unknown>) => answers.shift()?.(result),
    getFriends: read(FriendsTab.Friends),
    getPendingRequests: read(FriendsTab.Incoming),
    getSentRequests: read(FriendsTab.Sent),
    accept: (userId: number) => asked(`accept ${userId}`),
    decline: (userId: number) => asked(`decline ${userId}`),
    remove: (userId: number) => asked(`remove ${userId}`),
  };
}

describe('FriendsPageStore', () => {
  let store: FriendsPageStore;
  let toastStore: ToastStore;
  let friendshipApi: ReturnType<typeof createFriendshipApi>;
  let incomingRequests: { refresh: ReturnType<typeof vi.fn> };
  let isRemovalConfirmed: boolean;
  let askedToRemove: string[];

  const ids = (tab: FriendsTab) =>
    store
      .list(tab)
      .items()
      .map((entry) => entry.otherUser.id);
  const toasts = () => toastStore.visible().map((toast) => toast.message);

  beforeEach(() => {
    vi.useFakeTimers();
    friendshipApi = createFriendshipApi();
    friendshipApi.pages.friends = [row(1, 'Accepted'), row(2, 'Accepted')];
    friendshipApi.pages.incoming = [row(3, 'Pending'), row(4, 'Pending'), row(5, 'Pending')];
    friendshipApi.pages.sent = [row(6, 'Pending')];
    incomingRequests = { refresh: vi.fn(async () => undefined) };
    isRemovalConfirmed = true;
    askedToRemove = [];
    TestBed.configureTestingModule({
      providers: [
        FriendsPageStore,
        { provide: FriendshipApi, useValue: friendshipApi },
        { provide: IncomingRequestsStore, useValue: incomingRequests },
        {
          provide: ConfirmationOpener,
          useValue: {
            ask: async (question: { question: string; detail: string }) => {
              askedToRemove.push(`${question.question} ${question.detail}`);

              return isRemovalConfirmed;
            },
          },
        },
      ],
    });
    store = TestBed.inject(FriendsPageStore);
    toastStore = TestBed.inject(ToastStore);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('open', () => {
    it('reads a list the first time its tab opens, and not again', async () => {
      await store.open(FriendsTab.Friends);
      await store.open(FriendsTab.Friends);

      expect(friendshipApi.calls).toEqual(['read friends 1']);
      expect(ids(FriendsTab.Friends)).toEqual([1, 2]);
      expect(store.list(FriendsTab.Friends).status()).toBe(PageLoadStatus.Ended);
    });

    it('reads nothing for a tab that was not opened', async () => {
      await store.open(FriendsTab.Sent);

      expect(friendshipApi.calls).toEqual(['read sent 1']);
      expect(ids(FriendsTab.Incoming)).toEqual([]);
    });
  });

  describe('Decline and Cancel', () => {
    beforeEach(async () => {
      await store.open(FriendsTab.Incoming);
      await store.open(FriendsTab.Sent);
      friendshipApi.calls.length = 0;
    });

    it('takes the row out on the click, before the server answers, and refreshes the count after', async () => {
      const declining = store.perform(FriendshipAction.Decline, row(4, 'Pending'));

      expect(ids(FriendsTab.Incoming)).toEqual([3, 5]);
      expect(friendshipApi.calls).toEqual(['decline 4']);
      expect(incomingRequests.refresh).not.toHaveBeenCalled();

      friendshipApi.answer(ok(null));
      await declining;

      expect(ids(FriendsTab.Incoming)).toEqual([3, 5]);
      expect(incomingRequests.refresh).toHaveBeenCalledTimes(1);
    });

    it('puts the row back where it was and shows the reason when the server refuses', async () => {
      const declining = store.perform(FriendshipAction.Decline, row(4, 'Pending'));
      friendshipApi.answer(refusal);
      await declining;

      expect(ids(FriendsTab.Incoming)).toEqual([3, 4, 5]);
      expect(toasts()).toEqual(['Pending request not found']);
      expect(incomingRequests.refresh).not.toHaveBeenCalled();
    });

    it('cancels a sent request with the call that removes a friend, without asking, and leaves the count alone', async () => {
      const cancelling = store.perform(FriendshipAction.Cancel, row(6, 'Pending'));

      expect(ids(FriendsTab.Sent)).toEqual([]);
      expect(askedToRemove).toEqual([]);
      friendshipApi.answer(ok(null));
      await cancelling;

      expect(friendshipApi.calls).toEqual(['remove 6']);
      expect(incomingRequests.refresh).not.toHaveBeenCalled();
    });

    it('brings a cancelled request back when the server refuses', async () => {
      const cancelling = store.perform(FriendshipAction.Cancel, row(6, 'Pending'));
      friendshipApi.answer(fail('Relationship not found', 404));
      await cancelling;

      expect(ids(FriendsTab.Sent)).toEqual([6]);
      expect(toasts()).toEqual(['Relationship not found']);
    });

    it('ignores a second click on the same person while the first is on its way', async () => {
      const first = store.perform(FriendshipAction.Decline, row(4, 'Pending'));
      await store.perform(FriendshipAction.Accept, row(4, 'Pending'));
      friendshipApi.answer(ok(null));
      await first;

      expect(friendshipApi.calls).toEqual(['decline 4']);
    });

    it('does nothing for a person whose account is gone', async () => {
      const gone: StandardFriendshipDto = {
        ...row(4, 'Pending'),
        otherUser: { id: null, username: 'Deleted user' },
      };
      await store.perform(FriendshipAction.Decline, gone);

      expect(friendshipApi.calls).toEqual([]);
    });
  });

  describe('Accept', () => {
    beforeEach(async () => {
      await store.open(FriendsTab.Incoming);
      await store.open(FriendsTab.Friends);
      friendshipApi.calls.length = 0;
    });

    it('moves the person to My friends on the click, and refreshes the count once the server agrees', async () => {
      const accepting = store.perform(FriendshipAction.Accept, row(4, 'Pending'));

      expect(ids(FriendsTab.Incoming)).toEqual([3, 5]);
      expect(ids(FriendsTab.Friends)).toEqual([4, 1, 2]);
      expect(store.list(FriendsTab.Friends).items()[0].status).toBe('Accepted');
      friendshipApi.answer(ok(null));
      await accepting;

      expect(friendshipApi.calls).toEqual(['accept 4']);
      expect(incomingRequests.refresh).toHaveBeenCalledTimes(1);
    });

    it('moves the person back and shows the reason when the server refuses', async () => {
      const accepting = store.perform(FriendshipAction.Accept, row(4, 'Pending'));
      friendshipApi.answer(refusal);
      await accepting;

      expect(ids(FriendsTab.Incoming)).toEqual([3, 4, 5]);
      expect(ids(FriendsTab.Friends)).toEqual([1, 2]);
      expect(toasts()).toEqual(['Pending request not found']);
    });
  });

  describe('Remove', () => {
    beforeEach(async () => {
      await store.open(FriendsTab.Friends);
      friendshipApi.calls.length = 0;
    });

    it('asks first, naming the loss of the messages, and changes nothing when the user says no', async () => {
      isRemovalConfirmed = false;
      await store.perform(FriendshipAction.Remove, row(1, 'Accepted'));

      expect(askedToRemove).toHaveLength(1);
      expect(askedToRemove[0]).toContain('user_1');
      expect(askedToRemove[0]).toContain('messages');
      expect(ids(FriendsTab.Friends)).toEqual([1, 2]);
      expect(friendshipApi.calls).toEqual([]);
    });

    it('says "Deleting…" on the row until the server answers, then fades it out and takes the friend off the list', async () => {
      const removing = store.perform(FriendshipAction.Remove, row(1, 'Accepted'));
      await vi.advanceTimersByTimeAsync(deleteNoticeMinimumMilliseconds * 5);

      expect(friendshipApi.calls).toEqual(['remove 1']);
      expect(ids(FriendsTab.Friends)).toEqual([1, 2]);
      expect(store.waitingIds().has(1)).toBe(true);
      expect(store.fadingIds().has(1)).toBe(false);

      friendshipApi.answer(ok(null));
      await vi.advanceTimersByTimeAsync(0);

      expect(store.waitingIds().has(1)).toBe(false);
      expect(store.fadingIds().has(1)).toBe(true);
      expect(ids(FriendsTab.Friends)).toEqual([1, 2]);

      await vi.advanceTimersByTimeAsync(deleteFadeMilliseconds);
      await removing;

      expect(store.fadingIds().has(1)).toBe(false);
      expect(ids(FriendsTab.Friends)).toEqual([2]);
      expect(incomingRequests.refresh).not.toHaveBeenCalled();
    });

    it('keeps the friend and shows the reason when the server refuses', async () => {
      const removing = store.perform(FriendshipAction.Remove, row(1, 'Accepted'));
      await vi.advanceTimersByTimeAsync(0);
      friendshipApi.answer(fail('Relationship not found', 404));
      await vi.advanceTimersByTimeAsync(deleteNoticeMinimumMilliseconds);
      await removing;

      expect(ids(FriendsTab.Friends)).toEqual([1, 2]);
      expect(store.waitingIds().size).toBe(0);
      expect(store.fadingIds().size).toBe(0);
      expect(toasts()).toEqual(['Relationship not found']);
    });

    it('ignores a second click on a friend who is being removed', async () => {
      void store.perform(FriendshipAction.Remove, row(1, 'Accepted'));
      await vi.advanceTimersByTimeAsync(0);
      void store.perform(FriendshipAction.Remove, row(1, 'Accepted'));
      await vi.advanceTimersByTimeAsync(deleteNoticeMinimumMilliseconds);

      expect(askedToRemove).toHaveLength(1);
      expect(friendshipApi.calls).toEqual(['remove 1']);
    });
  });
});
