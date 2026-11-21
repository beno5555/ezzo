// Why the browser did not add a picked file (checkPhotos).
export const PhotoRefusalReason = {
  TooMany: 'TooMany',
  WrongType: 'WrongType',
  TooLarge: 'TooLarge',
} as const;
export type PhotoRefusalReason = (typeof PhotoRefusalReason)[keyof typeof PhotoRefusalReason];
