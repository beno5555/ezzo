import { ImageDto } from '../posts/image-dto';
import { MinimalUserDto } from '../users/minimal-user-dto';

// A message from a friend as the hub pushes it the moment it is stored (ReceiveMessage). images is in
// upload order, and their addresses need no token, so the photos show at once.
export type PushMessageDto = {
  id: number;
  content: string;
  images: ImageDto[];
  sender: MinimalUserDto;
  sentAt: string;
};
