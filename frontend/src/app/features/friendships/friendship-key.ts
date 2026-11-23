import { StandardFriendshipDto } from './standard-friendship-dto';

// What tells two rows of a friendship list apart: the other person's id. A person whose account is
// deactivated or deleted comes without one and under a shared placeholder name, so such a row is told apart
// by the name and the moment the request was sent.
export function friendshipKey(friendship: StandardFriendshipDto): number | string {
  return friendship.otherUser.id ?? `${friendship.otherUser.username}-${friendship.sentAt}`;
}
