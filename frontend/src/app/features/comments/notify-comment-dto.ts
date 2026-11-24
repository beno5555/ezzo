// A comment on the user's post as the hub pushes it the moment it is stored (ReceiveComment): to the post's
// author only, and never for the author's own comment. authorId is there for the commenter's picture (its
// disc colour follows the id); it is null when the commenter's account no longer exists (the comment's
// commenter id is cleared). A deactivated account keeps its id, and authorUsername is the placeholder name.
export type NotifyCommentDto = {
  id: number;
  authorId: number | null;
  authorUsername: string;
  content: string;
  postId: number;
};
