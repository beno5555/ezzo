// What a photo picker lets through: a post takes up to 10 photos, a message up to 5, and both the same
// types and file size (LIMITS.images).
export type PhotoRules = {
  maxCount: number;
  maxFileSizeBytes: number;
  acceptedTypes: readonly string[];
};
