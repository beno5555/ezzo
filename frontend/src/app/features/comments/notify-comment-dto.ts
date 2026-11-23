// A comment on the user's post as the hub pushes it the moment it is stored (ReceiveComment): to the post's
// author only, and never for the author's own comment. authorUsername is the placeholder name of an
// account that is deactivated or deleted.
export type NotifyCommentDto = {
  id: number;
  authorUsername: string;
  content: string;
  postId: number;
};
