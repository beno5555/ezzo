import { ImageDto } from '../../features/posts/image-dto';

// One thumbnail in a post's photo grid. index is the photo's place in upload order, where the viewer opens;
// moreCount is the number of photos the grid leaves out, shown as "+N" on the last tile, and 0 elsewhere.
export type PhotoGridTile = {
  image: ImageDto;
  index: number;
  moreCount: number;
};
