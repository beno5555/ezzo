import { AppResult } from '../../core/http/app-result';
import { FriendshipAction } from './friendship-action';
import { FriendshipApi } from './friendship-api';

// The call that carries out a friendship action on one person. Cancel and Remove are the same call: the
// backend removes a relationship in any state. Shared by every page that offers the buttons (a profile, the
// friends page, the search).
export function sendFriendshipAction(
  friendshipApi: FriendshipApi,
  action: FriendshipAction,
  personId: number,
): Promise<AppResult<unknown>> {
  const calls: Record<FriendshipAction, () => Promise<AppResult<unknown>>> = {
    [FriendshipAction.Add]: () => friendshipApi.sendRequest(personId),
    [FriendshipAction.Cancel]: () => friendshipApi.remove(personId),
    [FriendshipAction.Accept]: () => friendshipApi.accept(personId),
    [FriendshipAction.Decline]: () => friendshipApi.decline(personId),
    [FriendshipAction.Remove]: () => friendshipApi.remove(personId),
  };

  return calls[action]();
}
