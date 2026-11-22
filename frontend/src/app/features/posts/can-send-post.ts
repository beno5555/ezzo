import { LIMITS } from '../../core/limits';
import { NewPost } from './new-post';

// The backend's rules for a post's fields (CreatePostDto, UpdatePostDto and PostService): a title that is
// not blank, text or at least one photo, and neither over its length. The composer's Post button and the
// edit form's Save button stay disabled until they hold, so a post the backend would refuse for its
// fields is never sent. photoCount is the photos the post carries.
export function canSavePost(title: string, content: string, photoCount: number): boolean {
  const hasTitle = title.trim().length > 0;
  const hasText = content.trim().length > 0;
  const hasPhoto = photoCount > 0;
  const isTitleShortEnough = title.length <= LIMITS.posts.titleMaxLength;
  const isTextShortEnough = content.length <= LIMITS.posts.contentMaxLength;

  return hasTitle && (hasText || hasPhoto) && isTitleShortEnough && isTextShortEnough;
}

// The composer's draft: the same rules, with the photos the user picked.
export function canSendPost(draft: NewPost): boolean {
  return canSavePost(draft.title, draft.content, draft.photos.length);
}
