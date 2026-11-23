import { FriendshipAction } from './friendship-action';
import { friendshipActionsOffered, relationshipAfter } from './friendship-actions-offered';
import { Relationship } from './relationship';

const mine: Relationship = { status: 'Pending', isRequester: true };
const theirs: Relationship = { status: 'Pending', isRequester: false };

describe('friendshipActionsOffered', () => {
  it('offers Add to someone the caller has no relationship with', () => {
    expect(friendshipActionsOffered(null)).toEqual([FriendshipAction.Add]);
  });

  it('offers Add again after the other person declined the caller request', () => {
    expect(friendshipActionsOffered({ status: 'Declined', isRequester: true })).toEqual([
      FriendshipAction.Add,
    ]);
  });

  it('offers Add after the caller declined the other person request', () => {
    expect(friendshipActionsOffered({ status: 'Declined', isRequester: false })).toEqual([
      FriendshipAction.Add,
    ]);
  });

  it('offers Cancel while the caller request waits', () => {
    expect(friendshipActionsOffered(mine)).toEqual([FriendshipAction.Cancel]);
  });

  it('offers Accept and Decline, in that order, while the other request waits', () => {
    expect(friendshipActionsOffered(theirs)).toEqual([
      FriendshipAction.Accept,
      FriendshipAction.Decline,
    ]);
  });

  it.each([true, false])(
    'offers Remove to friends, whoever asked (requester: %s)',
    (isRequester) => {
      expect(friendshipActionsOffered({ status: 'Accepted', isRequester })).toEqual([
        FriendshipAction.Remove,
      ]);
    },
  );
});

describe('relationshipAfter', () => {
  it('turns Add into a waiting request of the caller, from nothing and from a decline', () => {
    const waiting: Relationship = { status: 'Pending', isRequester: true };

    expect(relationshipAfter(FriendshipAction.Add, null)).toEqual(waiting);
    expect(
      relationshipAfter(FriendshipAction.Add, { status: 'Declined', isRequester: false }),
    ).toEqual(waiting);
  });

  it('turns Cancel and Remove into no relationship', () => {
    expect(relationshipAfter(FriendshipAction.Cancel, mine)).toBeNull();
    expect(
      relationshipAfter(FriendshipAction.Remove, { status: 'Accepted', isRequester: true }),
    ).toBeNull();
  });

  it('turns Accept into a friendship', () => {
    expect(relationshipAfter(FriendshipAction.Accept, theirs)).toEqual({
      status: 'Accepted',
      isRequester: false,
    });
  });

  it('turns Decline into a declined request', () => {
    expect(relationshipAfter(FriendshipAction.Decline, theirs)).toEqual({
      status: 'Declined',
      isRequester: false,
    });
  });

  it('leaves what each action leads to offering what the table says', () => {
    expect(friendshipActionsOffered(relationshipAfter(FriendshipAction.Add, null))).toEqual([
      FriendshipAction.Cancel,
    ]);
    expect(friendshipActionsOffered(relationshipAfter(FriendshipAction.Accept, theirs))).toEqual([
      FriendshipAction.Remove,
    ]);
    expect(friendshipActionsOffered(relationshipAfter(FriendshipAction.Decline, theirs))).toEqual([
      FriendshipAction.Add,
    ]);
  });
});
