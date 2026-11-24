import { MinimalUserDto } from '../users/minimal-user-dto';

// A like on the user's post as the hub pushes it (PostLiked): to the post's author only, never for their
// own like, and not for an unlike. likeCount is the post's count after the like.
export type PostLikedDto = {
  postId: number;
  likedBy: MinimalUserDto;
  likeCount: number;
};
