import { StandardCommentDto } from '../comments/standard-comment-dto';
import { StandardPostDisplayDto } from './standard-post-display-dto';

// The backend's FullPostDisplayDto (Infrastructure/Dtos/Posts/FullPostDisplayDto.cs): a post read by id.
// It holds everything a StandardPostDisplayDto does, so a post card takes it as it is. Its comments are
// not used: the post's page reads them by pages through CommentApi.
export type FullPostDisplayDto = StandardPostDisplayDto & {
  comments: StandardCommentDto[];
};
