import { TestBed } from '@angular/core/testing';
import { AppResult, fail, ok } from '../../core/http/app-result';
import { ConfirmationOpener } from '../../shared/confirmation/confirmation-opener';
import { ToastStore } from '../../shared/toasts/toast-store';
import { FriendshipAction } from './friendship-action';
import { FriendshipApi } from './friendship-api';
import { FriendshipStatus } from './friendship-status';
import { IncomingRequestsStore } from './incoming-requests-store';
import { RelationshipReadStatus } from './relationship-read-status';
import { RelationshipStore } from './relationship-store';
import { StandardFriendshipDto } from './standard-friendship-dto';

const person = { id: 7, username: 'john_doe' };
const refusal = fail<never>('A pending friend request already exists', 400);

function relationshipRow(
  status: StandardFriendshipDto['status'],
  isRequester: boolean,
): StandardFriendshipDto {
  return {
    otherUser: { id: person.id, username: person.username },
    status,
    sentAt: '2026-11-21T10:00:00Z',
    lastUpdatedAt: null,
    isRequester,
  };
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
  let relationshipAnswer: AppResult<StandardFriendshipDto> = fail('No relationship', 404);

  return {
    calls,
    answer: (result: AppResult<unknown>) => answers.shift()?.(result),
    giveRelationship: (result: AppResult<StandardFriendshipDto>) => (relationshipAnswer = result),
    getRelationship: async (userId: number) => {
      calls.push(`relationship ${userId}`);

      return relationshipAnswer;
    },
    sendRequest: (userId: number) => asked(`add ${userId}`),
    accept: (userId: number) => asked(`accept ${userId}`),
    decline: (userId: number) => asked(`decline ${userId}`),
    remove: (userId: number) => asked(`remove ${userId}`),
  };
}

describe('RelationshipStore', () => {
  let store: RelationshipStore;
  let toastStore: ToastStore;
  let friendshipApi: ReturnType<typeof createFriendshipApi>;
  let incomingRequests: { refresh: ReturnType<typeof vi.fn> };
  let isRemovalConfirmed: boolean;

  const toasts = () => toastStore.visible().map((toast) => toast.message);

  beforeEach(() => {
    vi.useFakeTimers();
    friendshipApi = createFriendshipApi();
    incomingRequests = { refresh: vi.fn(async () => undefined) };
    isRemovalConfirmed = true;
    TestBed.configureTestingModule({
      providers: [
        RelationshipStore,
        { provide: FriendshipApi, useValue: friendshipApi },
        { provide: IncomingRequestsStore, useValue: incomingRequests },
        { provide: ConfirmationOpener, useValue: { ask: async () => isRemovalConfirmed } },
      ],
    });
    store = TestBed.inject(RelationshipStore);
    toastStore = TestBed.inject(ToastStore);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('load', () => {
    it('reads the relationship the backend reports, with who sent the request', async () => {
      friendshipApi.giveRelationship(ok(relationshipRow(FriendshipStatus.Pending, true)));

      await store.load(person.id);

      expect(store.status()).toBe(RelationshipReadStatus.Ready);
      expect(store.relationship()).toEqual({ status: FriendshipStatus.Pending, isRequester: true });
      expect(store.actions()).toEqual([FriendshipAction.Cancel]);
    });

    it('takes a 404 as no relationship, which offers Add', async () => {
      await store.load(person.id);

      expect(store.status()).toBe(RelationshipReadStatus.Ready);
      expect(store.relationship()).toBeNull();
      expect(store.actions()).toEqual([FriendshipAction.Add]);
    });

    it('keeps any other failure as a failed read with the reason', async () => {
      friendshipApi.giveRelationship(fail('The server is down.', 500));

      await store.load(person.id);

      expect(store.status()).toBe(RelationshipReadStatus.Failed);
      expect(store.failureMessage()).toBe('The server is down.');
    });
  });

  describe('perform', () => {
    it('shows the next state at once, and keeps it when the server accepts', async () => {
      await store.load(person.id);

      const done = store.perform(FriendshipAction.Add, person);

      expect(store.relationship()).toEqual({ status: FriendshipStatus.Pending, isRequester: true });
      expect(store.actions()).toEqual([FriendshipAction.Cancel]);

      friendshipApi.answer(ok({}));
      await done;

      expect(store.relationship()).toEqual({ status: FriendshipStatus.Pending, isRequester: true });
      expect(toasts()).toEqual([]);
    });

    it('puts the relationship back and shows the reason in a toast when the server refuses', async () => {
      await store.load(person.id);

      const done = store.perform(FriendshipAction.Add, person);
      friendshipApi.answer(refusal);
      await done;

      expect(store.relationship()).toBeNull();
      expect(store.actions()).toEqual([FriendshipAction.Add]);
      expect(toasts()).toEqual(['A pending friend request already exists']);
    });

    it('cancels a request with the same call that removes a friend', async () => {
      friendshipApi.giveRelationship(ok(relationshipRow(FriendshipStatus.Pending, true)));
      await store.load(person.id);

      const done = store.perform(FriendshipAction.Cancel, person);
      friendshipApi.answer(ok(undefined));
      await done;

      expect(friendshipApi.calls).toContain('remove 7');
      expect(store.relationship()).toBeNull();
    });

    it('declines a request the visitor was sent, which leaves Add on offer', async () => {
      friendshipApi.giveRelationship(ok(relationshipRow(FriendshipStatus.Pending, false)));
      await store.load(person.id);

      const done = store.perform(FriendshipAction.Decline, person);
      friendshipApi.answer(ok(undefined));
      await done;

      expect(friendshipApi.calls).toContain('decline 7');
      expect(store.actions()).toEqual([FriendshipAction.Add]);
    });

    it('ignores a second action while the first is on its way', async () => {
      friendshipApi.giveRelationship(ok(relationshipRow(FriendshipStatus.Pending, false)));
      await store.load(person.id);

      const first = store.perform(FriendshipAction.Accept, person);
      await store.perform(FriendshipAction.Decline, person);
      friendshipApi.answer(ok({}));
      await first;

      expect(store.isBusy()).toBe(false);
      expect(friendshipApi.calls.filter((call) => call !== 'relationship 7')).toEqual(['accept 7']);
    });
  });

  describe('removing a friend', () => {
    beforeEach(async () => {
      friendshipApi.giveRelationship(ok(relationshipRow(FriendshipStatus.Accepted, true)));
      await store.load(person.id);
    });

    it('changes nothing and sends nothing when the warning is not confirmed', async () => {
      isRemovalConfirmed = false;

      await store.perform(FriendshipAction.Remove, person);

      expect(store.isFriend()).toBe(true);
      expect(friendshipApi.calls).toEqual(['relationship 7']);
    });

    it('shows no relationship at once after the warning is confirmed', async () => {
      const done = store.perform(FriendshipAction.Remove, person);
      await vi.advanceTimersByTimeAsync(0);

      expect(store.relationship()).toBeNull();
      expect(friendshipApi.calls).toContain('remove 7');

      friendshipApi.answer(ok(undefined));
      await done;
    });

    it('puts the friendship back with a toast when the server refuses', async () => {
      const done = store.perform(FriendshipAction.Remove, person);
      await vi.advanceTimersByTimeAsync(0);
      friendshipApi.answer(fail('Not found', 404));
      await done;

      expect(store.isFriend()).toBe(true);
      expect(toasts()).toEqual(['Not found']);
    });
  });

  describe('what an accepted action changes elsewhere', () => {
    it('asks for the person’s friends to be read again after Accept, and refreshes the waiting requests', async () => {
      friendshipApi.giveRelationship(ok(relationshipRow(FriendshipStatus.Pending, false)));
      await store.load(person.id);

      const done = store.perform(FriendshipAction.Accept, person);
      friendshipApi.answer(ok({}));
      await done;

      expect(store.changeCount()).toBe(1);
      expect(incomingRequests.refresh).toHaveBeenCalledTimes(1);
    });

    it('refreshes the waiting requests after Decline, which leaves the friends as they were', async () => {
      friendshipApi.giveRelationship(ok(relationshipRow(FriendshipStatus.Pending, false)));
      await store.load(person.id);

      const done = store.perform(FriendshipAction.Decline, person);
      friendshipApi.answer(ok(undefined));
      await done;

      expect(store.changeCount()).toBe(0);
      expect(incomingRequests.refresh).toHaveBeenCalledTimes(1);
    });

    it('leaves both alone after Add', async () => {
      await store.load(person.id);

      const done = store.perform(FriendshipAction.Add, person);
      friendshipApi.answer(ok({}));
      await done;

      expect(store.changeCount()).toBe(0);
      expect(incomingRequests.refresh).not.toHaveBeenCalled();
    });
  });
});
