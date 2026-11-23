// The tabs of the moderation page, one per queue the server keeps.
export const QueueTab = {
  Posts: 'posts',
  Comments: 'comments',
} as const;
export type QueueTab = (typeof QueueTab)[keyof typeof QueueTab];
