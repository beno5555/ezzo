import { MinimalUserDto } from '../users/minimal-user-dto';
import { FriendshipStatus } from './friendship-status';

// A row of the friendship lists: the other person, and where the friendship stands.
export type StandardFriendshipDto = {
  otherUser: MinimalUserDto;
  status: FriendshipStatus;
  sentAt: string;
  lastUpdatedAt: string | null;
};
