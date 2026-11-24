import { MinimalUserDto } from '../users/minimal-user-dto';
import { FriendshipStatus } from './friendship-status';

// A row of the friendship lists, and the answer of the relationship read: the other person, and where the
// friendship stands. isRequester says who sent the request: true when the user the row is read for (the
// signed-in user, except on a profile's friends list, which is read for the profile's user) sent it.
export type StandardFriendshipDto = {
  otherUser: MinimalUserDto;
  status: FriendshipStatus;
  sentAt: string;
  lastUpdatedAt: string | null;
  isRequester: boolean;
};
