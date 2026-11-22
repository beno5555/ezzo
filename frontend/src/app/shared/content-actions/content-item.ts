// The post or comment a "…" menu belongs to. authorId is null for an unavailable account. postAuthorId is
// the author of the post a comment sits under, and null for a post itself, whose author the viewer is
// judged on authorId alone. isHidden is the item's moderation state as shown.
export type ContentItem = {
  authorId: number | null;
  isHidden: boolean;
  postAuthorId: number | null;
};
