import { ImageDto } from '../../features/posts/image-dto';
import { photoGridTiles } from './photo-grid-tiles';

const image = (id: number, orderIndex: number): ImageDto => ({
  id,
  address: `/api/images/${id}.jpg`,
  orderIndex,
});

describe('photoGridTiles', () => {
  it('shows the photos in upload order, with nothing more to count', () => {
    const tiles = photoGridTiles([image(21, 2), image(19, 0), image(20, 1)]);

    expect(tiles).toEqual([
      { image: image(19, 0), index: 0, moreCount: 0 },
      { image: image(20, 1), index: 1, moreCount: 0 },
      { image: image(21, 2), index: 2, moreCount: 0 },
    ]);
  });

  it('shows four photos, and counts the rest on the last one', () => {
    const images = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((orderIndex) =>
      image(orderIndex + 1, orderIndex),
    );

    const tiles = photoGridTiles(images);

    expect(tiles.map((tile) => tile.image.id)).toEqual([1, 2, 3, 4]);
    expect(tiles.map((tile) => tile.moreCount)).toEqual([0, 0, 0, 6]);
  });

  it('shows no tile for a post without photos', () => {
    expect(photoGridTiles([])).toEqual([]);
  });
});
