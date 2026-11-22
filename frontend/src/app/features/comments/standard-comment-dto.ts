import { MinimalUserDto } from '../users/minimal-user-dto';

// The backend's StandardCommentDto (Infrastructure/Dtos/Comments/StandardCommentDto.cs): a comment in a
// post's list. isHidden is true only for the author or an administrator, because nobody else is sent
// hidden content.
export type StandardCommentDto = {
  id: number;
  content: string;
  author: MinimalUserDto;
  uploadedAt: string;
  isHidden: boolean;
};
