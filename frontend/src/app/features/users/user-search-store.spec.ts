import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppResult, fail, ok } from '../../core/http/app-result';
import { PagedList } from '../../core/paging/paged-list';
import { SessionStore } from '../../core/session/session-store';
import { ConfirmationOpener } from '../../shared/confirmation/confirmation-opener';
import { ToastStore } from '../../shared/toasts/toast-store';
import { FriendshipAction } from '../friendships/friendship-action';
import { FriendshipApi } from '../friendships/friendship-api';
import { FriendshipStatus } from '../friendships/friendship-status';
import { IncomingRequestsStore } from '../friendships/incoming-requests-store';
import { SearchUserDto } from './search-user-dto';
import { UserSearchStore } from './user-search-store';

const signedInUserId = 1;
const refusal = fail<never>('A pending friend request already exists', 400);

function user(id: number, relationship: SearchUserDto['relationship'] = null): SearchUserDto {
  return { id, username: `user_${id}`, relationship };
}

// A FriendshipApi whose answers the test gives one at a time, and a record of the calls it got.
function createFriendshipApi() {
  const calls: string[] = [];
  const answers: ((result: AppResult<unknown>) => void)[] = [];
  const asked = (call: string) =>
    new Promise<AppResult<never>>((resolve) => {
      calls.push(call);
      answers.push(resolve as (result: AppResult<unknown>) => void);
    });

  return {
    calls,
    answer: (result: AppResult<unknown>) => answers.shift()?.(result),
    sendRequest: (userId: number) => asked(`add ${userId}`),
    accept: (userId: number) => asked(`accept ${userId}`),
    decline: (userId: number) => asked(`decline ${userId}`),
    remove: (userId: number) => asked(`remove ${userId}`),
  };
}

describe('UserSearchStore', () => {
  let store: UserSearchStore;
  let toastStore: ToastStore;
  let friendshipApi: ReturnType<typeof createFriendshipApi>;
  let incomingRequests: { refresh: ReturnType<typeof vi.fn> };
  let isRemovalConfirmed: boolean;
  let askedToRemove: boolean;
  let session: {
    isSignedIn: ReturnType<typeof signal<boolean>>;
    userId: ReturnType<typeof signal<number | null>>;
  };
  let list: PagedList<SearchUserDto>;

  const toasts = () => toastStore.visible().map((toast) => toast.message);
  const rowOf = (id: number) => list.items().find((item) => item.id === id);

  async function listOf(...users: SearchUserDto[]): Promise<PagedList<SearchUserDto>> {
    const searched = new PagedList<SearchUserDto>({
      loadPage: async () => ok(users),
      pageSize: 30,
      keyOf: (item) => item.id,
    });
    await searched.loadNext();

    return searched;
  }

  beforeEach(async () => {
    friendshipApi = createFriendshipApi();
    incomingRequests = { refresh: vi.fn(async () => undefined) };
    isRemovalConfirmed = true;
    askedToRemove = false;
    session = { isSignedIn: signal(true), userId: signal<number | null>(signedInUserId) };
    TestBed.configureTestingModule({
      providers: [
        UserSearchStore,
        { provide: FriendshipApi, useValue: friendshipApi },
        { provide: IncomingRequestsStore, useValue: incomingRequests },
        { provide: SessionStore, useValue: session },
        {
          provide: ConfirmationOpener,
          useValue: {
            ask: async () => {
              askedToRemove = true;

              return isRemovalConfirmed;
            },
          },
        },
      ],
    });
    store = TestBed.inject(UserSearchStore);
    toastStore = TestBed.inject(ToastStore);
    list = await listOf(
      user(2),
      user(3, { status: FriendshipStatus.Pending, isRequester: true }),
      user(4, { status: FriendshipStatus.Pending, isRequester: false }),
      user(5, { status: FriendshipStatus.Accepted, isRequester: true }),
      user(signedInUserId),
    );
  });

  describe('actionsFor', () => {
    it('offers the buttons the relationship calls for, as a profile does', () => {
      expect(store.actionsFor(user(2))).toEqual([FriendshipAction.Add]);
      expect(store.actionsFor(rowOf(3)!)).toEqual([FriendshipAction.Cancel]);
      expect(store.actionsFor(rowOf(4)!)).toEqual([
        FriendshipAction.Accept,
        FriendshipAction.Decline,
      ]);
      expect(store.actionsFor(rowOf(5)!)).toEqual([FriendshipAction.Remove]);
    });

    it('offers Add again after a declined request', () => {
      const declined = user(6, { status: FriendshipStatus.Declined, isRequester: true });

      expect(store.actionsFor(declined)).toEqual([FriendshipAction.Add]);
    });

    it('offers nothing on the signed-in user’s own row', () => {
      expect(store.actionsFor(user(signedInUserId))).toEqual([]);
    });

    it('offers nothing to a guest', () => {
      session.isSignedIn.set(false);
      session.userId.set(null);

      expect(store.actionsFor(user(2))).toEqual([]);
    });
  });

  describe('perform', () => {
    it('shows the next relationship at once, and keeps it when the server accepts', async () => {
      const done = store.perform(FriendshipAction.Add, rowOf(2)!, list);

      expect(rowOf(2)?.relationship).toEqual({
        status: FriendshipStatus.Pending,
        isRequester: true,
      });
      expect(store.actionsFor(rowOf(2)!)).toEqual([FriendshipAction.Cancel]);
      expect(friendshipApi.calls).toEqual(['add 2']);

      friendshipApi.answer(ok({}));
      await done;

      expect(rowOf(2)?.relationship).toEqual({
        status: FriendshipStatus.Pending,
        isRequester: true,
      });
      expect(toasts()).toEqual([]);
    });

    it('puts the row back and shows the reason in a toast when the server refuses', async () => {
      const done = store.perform(FriendshipAction.Add, rowOf(2)!, list);
      friendshipApi.answer(refusal);
      await done;

      expect(rowOf(2)?.relationship).toBeNull();
      expect(toasts()).toEqual(['A pending friend request already exists']);
    });

    it('turns a cancelled request into no relationship', async () => {
      const done = store.perform(FriendshipAction.Cancel, rowOf(3)!, list);
      friendshipApi.answer(ok(undefined));
      await done;

      expect(friendshipApi.calls).toEqual(['remove 3']);
      expect(rowOf(3)?.relationship).toBeNull();
    });

    it('turns Accept into friends, and reads the count of waiting requests again', async () => {
      const done = store.perform(FriendshipAction.Accept, rowOf(4)!, list);
      friendshipApi.answer(ok({}));
      await done;

      expect(friendshipApi.calls).toEqual(['accept 4']);
      expect(rowOf(4)?.relationship?.status).toBe(FriendshipStatus.Accepted);
      expect(incomingRequests.refresh).toHaveBeenCalledTimes(1);
    });

    it('does not read the count again after an action that is not an answer', async () => {
      const done = store.perform(FriendshipAction.Add, rowOf(2)!, list);
      friendshipApi.answer(ok({}));
      await done;

      expect(incomingRequests.refresh).not.toHaveBeenCalled();
    });

    it('turns a Decline into a declined request, which offers Add', async () => {
      const done = store.perform(FriendshipAction.Decline, rowOf(4)!, list);
      friendshipApi.answer(ok({}));
      await done;

      expect(rowOf(4)?.relationship?.status).toBe(FriendshipStatus.Declined);
      expect(store.actionsFor(rowOf(4)!)).toEqual([FriendshipAction.Add]);
    });

    it('asks before removing a friend, and removes only on a yes', async () => {
      const done = store.perform(FriendshipAction.Remove, rowOf(5)!, list);
      await vi.waitFor(() => expect(friendshipApi.calls).toEqual(['remove 5']));
      friendshipApi.answer(ok(undefined));
      await done;

      expect(askedToRemove).toBe(true);
      expect(rowOf(5)?.relationship).toBeNull();
    });

    it('changes nothing when the removal is not confirmed', async () => {
      isRemovalConfirmed = false;

      await store.perform(FriendshipAction.Remove, rowOf(5)!, list);

      expect(friendshipApi.calls).toEqual([]);
      expect(rowOf(5)?.relationship?.status).toBe(FriendshipStatus.Accepted);
      expect(store.busyIds().has(5)).toBe(false);
    });

    it('marks the person busy while the request is on its way, and ignores a second click', async () => {
      const first = store.perform(FriendshipAction.Add, rowOf(2)!, list);
      expect(store.busyIds().has(2)).toBe(true);

      await store.perform(FriendshipAction.Add, rowOf(2)!, list);
      expect(friendshipApi.calls).toEqual(['add 2']);

      friendshipApi.answer(ok({}));
      await first;

      expect(store.busyIds().has(2)).toBe(false);
    });

    it('lets two different people be acted on at the same time', async () => {
      const first = store.perform(FriendshipAction.Add, rowOf(2)!, list);
      const second = store.perform(FriendshipAction.Cancel, rowOf(3)!, list);

      expect(friendshipApi.calls).toEqual(['add 2', 'remove 3']);

      friendshipApi.answer(ok({}));
      friendshipApi.answer(ok(undefined));
      await Promise.all([first, second]);
    });

    it('changes the list it was given, not a newer one', async () => {
      const newer = await listOf(user(2));
      const done = store.perform(FriendshipAction.Add, rowOf(2)!, list);
      friendshipApi.answer(ok({}));
      await done;

      expect(newer.items()[0].relationship).toBeNull();
    });
  });
});
