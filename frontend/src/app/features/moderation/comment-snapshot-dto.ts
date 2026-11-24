import { MinimalUserDto } from '../users/minimal-user-dto';

// What an administrator sees of a comment under review (CommentSnapshotDto): a report's comment and a
// flagged comment, with the id and title of its post.
export type CommentSnapshotDto = {
  id: number;
  content: string;
  author: MinimalUserDto;
  postId: number;
  postTitle: string;
  uploadedAt: string;
  isHidden: boolean;
};
