import { ImageDto } from '../../features/posts/image-dto';

// What the photo viewer opens with: every photo, in upload order, and the place of the one clicked.
// onRemove, when given, adds a Remove button for the photo shown (photos a user picked and has not sent);
// the viewer hands each removed photo to it and stays open on the next one.
export type PhotoViewerData = {
  images: readonly ImageDto[];
  startIndex: number;
  onRemove?: (image: ImageDto) => void;
};
