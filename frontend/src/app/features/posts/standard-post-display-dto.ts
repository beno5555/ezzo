import { MinimalUserDto } from '../users/minimal-user-dto';
import { ImageDto } from './image-dto';

// The backend's StandardPostDisplayDto (Infrastructure/Dtos/Posts/StandardPostDisplayDto.cs): a post in a
// list (the feed, a profile's posts). likedByCaller is false for a guest; isHidden is true only for the
// author or an administrator, because nobody else is sent hidden content.
export type StandardPostDisplayDto = {
  id: number;
  title: string;
  author: MinimalUserDto;
  postContent: string;
  uploadedAt: string;
  images: ImageDto[];
  likeCount: number;
  commentCount: number;
  likedByCaller: boolean;
  isHidden: boolean;
};
