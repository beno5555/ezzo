import { LIMITS } from '../../core/limits';

// The backend's rules for a comment (CreateCommentDto): text that is not blank and not over its length.
// The Send and Save buttons stay disabled until they hold, so a comment the backend would refuse for its
// text is never sent.
export function canSendComment(content: string): boolean {
  const hasText = content.trim().length > 0;
  const isShortEnough = content.length <= LIMITS.comments.contentMaxLength;

  return hasText && isShortEnough;
}
