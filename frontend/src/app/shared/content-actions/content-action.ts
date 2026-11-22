// What the "…" menu of a post or a comment can offer. contentActionsOffered decides which of them a
// viewer gets, in the order the menu lists them.
export const ContentAction = {
  Edit: 'Edit',
  Delete: 'Delete',
  Hide: 'Hide',
  MakeVisible: 'MakeVisible',
  Report: 'Report',
} as const;
export type ContentAction = (typeof ContentAction)[keyof typeof ContentAction];
