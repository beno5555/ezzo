// What a user can do about a friendship from a profile. friendshipActionsOffered decides which are offered.
// Cancel and Remove both call the same endpoint: the backend removes a relationship in any state.
export const FriendshipAction = {
  Add: 'Add',
  Cancel: 'Cancel',
  Accept: 'Accept',
  Decline: 'Decline',
  Remove: 'Remove',
} as const;
export type FriendshipAction = (typeof FriendshipAction)[keyof typeof FriendshipAction];
