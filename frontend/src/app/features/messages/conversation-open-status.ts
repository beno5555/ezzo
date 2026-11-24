// Where opening a conversation at /messages/:username stands. Loading: the username is being turned into a
// friend. NotFound: no user has it. NotFriend: the user is not a friend (or is the signed-in user). Failed:
// the lookup did not answer, and opening again tries once more. Ready: the friend is known, and the
// history loads by pages from there.
export const ConversationOpenStatus = {
  Loading: 'Loading',
  NotFound: 'NotFound',
  NotFriend: 'NotFriend',
  Failed: 'Failed',
  Ready: 'Ready',
} as const;
export type ConversationOpenStatus =
  (typeof ConversationOpenStatus)[keyof typeof ConversationOpenStatus];
