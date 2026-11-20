import { ImageDto } from '../../features/posts/image-dto';

// What the photo viewer opens with: every photo, in upload order, and the place of the one clicked.
export type PhotoViewerData = {
  images: readonly ImageDto[];
  startIndex: number;
};
