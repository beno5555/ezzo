import { DisplayFriendDto } from './display-friend-dto';
import { FriendshipStatus } from './friendship-status';

// The signed-in user's friendship with one friend, read only while it is accepted. The friend comes as a
// chat row, with presence.
export type AcceptedFriendshipDto = {
  otherUser: DisplayFriendDto;
  status: FriendshipStatus;
  sentAt: string;
  lastUpdatedAt: string | null;
};
