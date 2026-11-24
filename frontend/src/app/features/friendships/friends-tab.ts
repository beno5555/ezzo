// The three lists of the friends page, by the name the tabs and the ids of a panel use.
export const FriendsTab = {
  Friends: 'friends',
  Incoming: 'incoming',
  Sent: 'sent',
} as const;
export type FriendsTab = (typeof FriendsTab)[keyof typeof FriendsTab];
