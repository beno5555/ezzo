import { FriendshipStatus } from './friendship-status';

// What sending a friend request answers with.
export type MinimalFriendshipDto = {
  requesterId: number;
  addresseeId: number;
  sentAt: string;
  status: FriendshipStatus;
};
