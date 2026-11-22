import { StandardPostDisplayDto } from './standard-post-display-dto';

// The backend's FullPostDisplayDto (Infrastructure/Dtos/Posts/FullPostDisplayDto.cs): a post read by id,
// and what an edited post and a post after a photo's removal come back as. It holds what a
// StandardPostDisplayDto does. Its comments are not part of it: a post can have thousands, so the post's
// page reads them by pages through CommentApi, and commentCount says how many there are.
export type FullPostDisplayDto = StandardPostDisplayDto;
