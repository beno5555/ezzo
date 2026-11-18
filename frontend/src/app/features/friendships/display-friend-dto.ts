// A friend row in the chat lists. lastActiveAt is null while the friend is online, and isActive says the same.
export type DisplayFriendDto = {
  id: number;
  username: string;
  lastActiveAt: string | null;
  isActive: boolean;
};
