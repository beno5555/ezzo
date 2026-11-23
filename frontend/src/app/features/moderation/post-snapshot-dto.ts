import { ImageDto } from '../posts/image-dto';
import { MinimalUserDto } from '../users/minimal-user-dto';

// What an administrator sees of a post under review (PostSnapshotDto): a report's post and a flagged post.
// The photos are in upload order. isHidden is false in the moderation queue, which lists flagged posts only.
export type PostSnapshotDto = {
  id: number;
  title: string;
  postContent: string;
  images: ImageDto[];
  author: MinimalUserDto;
  uploadedAt: string;
  isHidden: boolean;
};
