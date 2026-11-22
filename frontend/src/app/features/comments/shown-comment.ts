import { StandardCommentDto } from './standard-comment-dto';

// One comment as the post's page shows it (CommentThreadStore.shown).
//   isSending:  a new comment or an edit on its way to the server: "Sending…" is shown under it
//   isOnServer: false for a new comment the server does not have yet; it cannot be edited or deleted
//   isFading:   its deletion was confirmed and it is fading out before it leaves the list
export type ShownComment = {
  comment: StandardCommentDto;
  isSending: boolean;
  isOnServer: boolean;
  isFading: boolean;
};
