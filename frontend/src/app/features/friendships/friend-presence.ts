import { DisplayFriendDto } from './display-friend-dto';

// A friend as presence shows them. lastActiveAt is null while the friend is online.
export type FriendPresence = Pick<DisplayFriendDto, 'id' | 'username' | 'lastActiveAt'>;
