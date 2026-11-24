// Where the composer's page was opened from, handed to it in the navigation's state (the address stays
// /posts/new, so a link to it is the same wherever it is shared from). Only the profile needs saying: the
// composer leads back to the feed otherwise. A profile's Write a post button passes profileOrigin, so that
// Back, the link above the heading and a sent post all return to the profile, not to the feed.
export type NewPostOrigin = { fromProfile?: boolean };

export const profileOrigin: NewPostOrigin = { fromProfile: true };

// The navigation's state as "did it come from a profile"; anything else in it, or no state, says no.
export function isFromProfile(state: unknown): boolean {
  const isObject = typeof state === 'object' && state !== null;

  return isObject && 'fromProfile' in state && state.fromProfile === true;
}
