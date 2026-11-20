// Where a PagedList stands. Idle: the next page may be loaded. Loading: a page is on its way. Failed: the
// last page did not arrive, and loading again asks for it once more. Ended: the last page has arrived.
export const PageLoadStatus = {
  Idle: 'Idle',
  Loading: 'Loading',
  Failed: 'Failed',
  Ended: 'Ended',
} as const;
export type PageLoadStatus = (typeof PageLoadStatus)[keyof typeof PageLoadStatus];
