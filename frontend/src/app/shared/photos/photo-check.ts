import { PhotoRefusal } from './photo-refusal';

// The result of checkPhotos: the files to add, in the order they were picked, and the ones refused.
export type PhotoCheck = {
  accepted: File[];
  refusals: PhotoRefusal[];
};
