// The tabs of a profile. A guest gets only Posts: the friends list requires sign-in.
export const ProfileTab = {
  Posts: 'posts',
  Friends: 'friends',
} as const;
export type ProfileTab = (typeof ProfileTab)[keyof typeof ProfileTab];
