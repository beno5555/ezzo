// The three sizes of a profile picture: small beside a comment, medium beside a post or a chat row,
// large on a profile.
export const AvatarSize = { Small: 'small', Medium: 'medium', Large: 'large' } as const;
export type AvatarSize = (typeof AvatarSize)[keyof typeof AvatarSize];
