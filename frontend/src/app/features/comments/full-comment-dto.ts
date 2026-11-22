import { StandardCommentDto } from './standard-comment-dto';

// The backend's FullCommentDto (Infrastructure/Dtos/Comments/FullCommentDto.cs): what a comment read by
// id, a new comment and an edited comment come back as. It holds everything a StandardCommentDto does, so
// a list takes it as it is.
export type FullCommentDto = StandardCommentDto & {
  postId: number;
  lastUpdatedAt: string | null;
};
