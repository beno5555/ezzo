// Whether a profile's relationship with the signed-in user has been read yet (RelationshipStore).
export const RelationshipReadStatus = {
  Loading: 'loading',
  Ready: 'ready',
  Failed: 'failed',
} as const;
export type RelationshipReadStatus =
  (typeof RelationshipReadStatus)[keyof typeof RelationshipReadStatus];
