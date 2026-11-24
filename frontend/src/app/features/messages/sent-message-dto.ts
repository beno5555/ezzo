import { ImageDto } from '../posts/image-dto';

// The sender's own copy of a message the backend stored (POST /api/messages/{receiverId}). images is in
// upload order, empty for a message with text only.
export type SentMessageDto = {
  id: number;
  content: string;
  images: ImageDto[];
  sentAt: string;
};
