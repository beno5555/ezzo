import { ImageDto } from '../../features/posts/image-dto';
import { inUploadOrder } from './in-upload-order';
import { PhotoGridTile } from './photo-grid-tile';

// A card shows at most this many thumbnails; the viewer shows them all.
export const MAX_GRID_TILES = 4;

// The thumbnails a post's grid shows: the photos in upload order, at most MAX_GRID_TILES of them, with the
// count of the rest on the last one.
export function photoGridTiles(images: readonly ImageDto[]): PhotoGridTile[] {
  const ordered = inUploadOrder(images);
  const shown = ordered.slice(0, MAX_GRID_TILES);
  const hiddenCount = ordered.length - shown.length;
  const lastIndex = shown.length - 1;
  return shown.map((image, index) => ({
    image,
    index,
    moreCount: index === lastIndex ? hiddenCount : 0,
  }));
}
