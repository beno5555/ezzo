import { FriendshipAction } from './friendship-action';

// Whether the action answers a request waiting for the user (Accept or Decline), which changes the count of
// such requests the top bar shows.
export function answersRequest(action: FriendshipAction): boolean {
  return action === FriendshipAction.Accept || action === FriendshipAction.Decline;
}
