import { ImageDto } from '../posts/image-dto';
import { MinimalUserDto } from '../users/minimal-user-dto';

// A message of a conversation's history (GET /api/messages/conversation/{otherUserId}). images is in
// upload order, empty for a message with text only. isEdited says that the text was changed after sending.
export type StandardMessageDto = {
  id: number;
  content: string;
  images: ImageDto[];
  sender: MinimalUserDto;
  receiverId: number;
  sentAt: string;
  seen: boolean;
  seenAt: string | null;
  isEdited: boolean;
};
