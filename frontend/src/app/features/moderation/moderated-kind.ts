// What an administrator moderates from a "…" menu: a post or a comment.
export const ModeratedKind = {
  Post: 'Post',
  Comment: 'Comment',
} as const;
export type ModeratedKind = (typeof ModeratedKind)[keyof typeof ModeratedKind];
