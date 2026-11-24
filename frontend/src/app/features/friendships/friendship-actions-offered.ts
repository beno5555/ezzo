import { FriendshipAction } from './friendship-action';
import { FriendshipStatus } from './friendship-status';
import { Relationship } from './relationship';

// The buttons a profile offers for the relationship the backend reports, in the order they show (the
// table in the profile ticket):
//   none, or a declined request   Add
//   my request is waiting         Cancel
//   their request is waiting      Accept, Decline
//   friends                       Remove
// After a decline, whichever side declined, Add is offered again: the backend lets the original sender
// reopen the request and the original addressee send one the other way.
export function friendshipActionsOffered(relationship: Relationship | null): FriendshipAction[] {
  const isFriend = relationship !== null && relationship.status === FriendshipStatus.Accepted;
  const isWaiting = relationship !== null && relationship.status === FriendshipStatus.Pending;

  let offered: FriendshipAction[] = [FriendshipAction.Add];
  if (isFriend) {
    offered = [FriendshipAction.Remove];
  } else if (isWaiting) {
    offered = relationship.isRequester
      ? [FriendshipAction.Cancel]
      : [FriendshipAction.Accept, FriendshipAction.Decline];
  }

  return offered;
}

// The relationship an action leads to, which the profile shows before the server has answered. Cancel and
// Remove leave none. Add leaves the caller's own waiting request, whether the last one was declined or
// there was none.
export function relationshipAfter(
  action: FriendshipAction,
  current: Relationship | null,
): Relationship | null {
  const isRequester = current?.isRequester ?? false;
  const after: Record<FriendshipAction, Relationship | null> = {
    [FriendshipAction.Add]: { status: FriendshipStatus.Pending, isRequester: true },
    [FriendshipAction.Cancel]: null,
    [FriendshipAction.Accept]: { status: FriendshipStatus.Accepted, isRequester },
    [FriendshipAction.Decline]: { status: FriendshipStatus.Declined, isRequester },
    [FriendshipAction.Remove]: null,
  };

  return after[action];
}
