// The hub's MessageSeen: the friend (seenBy) has read the user's messages, at seenAt.
export type MessageSeenDto = {
  seenBy: number;
  seenAt: string;
};
