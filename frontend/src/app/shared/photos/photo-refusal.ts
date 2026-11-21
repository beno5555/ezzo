import { PhotoRefusalReason } from './photo-refusal-reason';

// One picked file the browser did not add, named so that the message can say which file and why.
export type PhotoRefusal = {
  fileName: string;
  reason: PhotoRefusalReason;
};
