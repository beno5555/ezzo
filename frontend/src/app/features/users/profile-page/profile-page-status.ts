// What the profile page shows in place of the profile: it is loading, the profile is there, there is no
// such user for this visitor (an unknown username, or an account that is deactivated or deleted), or
// loading failed for another reason, with a way to try again.
export const ProfilePageStatus = {
  Loading: 'loading',
  Ready: 'ready',
  NotFound: 'not-found',
  Failed: 'failed',
} as const;
export type ProfilePageStatus = (typeof ProfilePageStatus)[keyof typeof ProfilePageStatus];
