import { ImageDto } from '../../features/posts/image-dto';
import { inUploadOrder } from './in-upload-order';
import { PhotoGridTile } from './photo-grid-tile';

// A card shows at most this many thumbnails; the viewer shows them all.
export const MAX_GRID_TILES = 4;

// The thumbnails a grid shows: the photos in upload order, at most maxTiles of them (a post card's four by
// default, three in the chat's message box), with the count of the rest on the last one.
export function photoGridTiles(
  images: readonly ImageDto[],
  maxTiles = MAX_GRID_TILES,
): PhotoGridTile[] {
  const ordered = inUploadOrder(images);
  const shown = ordered.slice(0, maxTiles);
  const hiddenCount = ordered.length - shown.length;
  const lastIndex = shown.length - 1;
  return shown.map((image, index) => ({
    image,
    index,
    moreCount: index === lastIndex ? hiddenCount : 0,
  }));
}
