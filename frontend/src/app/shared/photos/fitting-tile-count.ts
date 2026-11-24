// How many square thumbnails of tileSize fit side by side in a row of width, gap apart; at least one,
// so that a row narrower than a thumbnail still shows the photos ("+N" on that one).
export function fittingTileCount(width: number, tileSize: number, gap: number): number {
  const fitting = Math.floor((width + gap) / (tileSize + gap));

  return Math.max(1, fitting);
}
