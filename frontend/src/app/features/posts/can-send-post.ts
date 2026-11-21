import { LIMITS } from '../../core/limits';
import { NewPost } from './new-post';

// The backend's rules for a new post (CreatePostDto and PostService.UploadPost): a title that is not
// blank, text or at least one photo, and neither over its length. The composer's Post button stays
// disabled until they hold, so a post the backend would refuse for its fields is never sent.
export function canSendPost(draft: NewPost): boolean {
  const hasTitle = draft.title.trim().length > 0;
  const hasText = draft.content.trim().length > 0;
  const hasPhoto = draft.photos.length > 0;
  const isTitleShortEnough = draft.title.length <= LIMITS.posts.titleMaxLength;
  const isTextShortEnough = draft.content.length <= LIMITS.posts.contentMaxLength;

  return hasTitle && (hasText || hasPhoto) && isTitleShortEnough && isTextShortEnough;
}
