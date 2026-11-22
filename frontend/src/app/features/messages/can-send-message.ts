import { LIMITS } from '../../core/limits';

// The backend's rules for a message (CreateMessageDto): text that is not blank, or at least one photo, and
// neither over its limit. The Send button stays disabled until they hold. The photo picker already refuses
// a sixth photo, so the count is only a second guard.
export function canSendMessage(content: string, photoCount: number): boolean {
  const hasText = content.trim().length > 0;
  const hasPhotos = photoCount > 0;
  const isShortEnough = content.length <= LIMITS.messages.contentMaxLength;
  const hasRoomForPhotos = photoCount <= LIMITS.images.maxPerMessage;

  return (hasText || hasPhotos) && isShortEnough && hasRoomForPhotos;
}
