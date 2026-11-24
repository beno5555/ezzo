// Where the composer's page was opened from, handed to it in the navigation's state (the address stays
// /posts/new, so a link to it is the same wherever it is shared from). Only the profile needs saying: from
// anywhere else a sent post goes to the writer's own profile. A profile's Write a post button passes profileOrigin, so
// that a sent post returns to the profile itself (the Back link, BackLink, goes back to wherever the reader
// came from, whatever the origin).
export type NewPostOrigin = { fromProfile?: boolean };

export const profileOrigin: NewPostOrigin = { fromProfile: true };

// The navigation's state as "did it come from a profile"; anything else in it, or no state, says no.
export function isFromProfile(state: unknown): boolean {
  const isObject = typeof state === 'object' && state !== null;

  return isObject && 'fromProfile' in state && state.fromProfile === true;
}
