import { fittingTileCount } from './fitting-tile-count';

// 64 px thumbnails 8 px apart, as in the message box on a phone.
const tileSize = 64;
const gap = 8;

describe('fittingTileCount', () => {
  it('counts the thumbnails a row has room for, with the gaps between them', () => {
    expect(fittingTileCount(232, tileSize, gap)).toBe(3);
  });

  it('fits a last thumbnail that needs no gap after it', () => {
    expect(fittingTileCount(352, tileSize, gap)).toBe(5);
  });

  it('leaves out a thumbnail that would be cut off', () => {
    expect(fittingTileCount(351, tileSize, gap)).toBe(4);
  });

  it('keeps one thumbnail in a row narrower than it', () => {
    expect(fittingTileCount(40, tileSize, gap)).toBe(1);
  });
});
