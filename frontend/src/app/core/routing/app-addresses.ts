// The app's own addresses that code and the shell link to (the table under "Addresses" in
// .scratch/frontend/spec.md). app.routes.ts holds the patterns; this file holds the addresses.
export const appAddresses = {
  // The home address. Ticket 26 sends a signed-in user on from here to the feed.
  home: '/',
  feed: '/feed',
  // The composer's page, opened from the feed's Write a post button and from a refused post's toast.
  newPost: '/posts/new',
  signIn: '/sign-in',
  register: '/register',
  forgotPassword: '/forgot-password',
  // The reset email links here with ?token=…, so the backend must accept this page's origin
  // (Cors:AllowedOrigins, docs/backend/auth.md).
  resetPassword: '/reset-password',
  reactivateAccount: '/reactivate-account',
  search: '/search',
  settings: '/settings',
  friends: '/friends',
  messages: '/messages',
  admin: '/admin',
  // As router link commands, so the username is encoded as one segment.
  profile: (username: string) => ['/users', username],
  post: (postId: number) => ['/posts', postId],
} as const;

// The query parameter that carries the address a guard turned the user away from.
export const returnAddressParameter = 'returnUrl';

// The query parameter of the search page that carries what to search for.
export const searchQueryParameter = 'q';

// The query parameters of the search page for a query: an empty one leaves ?q= out of the address.
export function searchQueryParameters(query: string): Record<string, string | null> {
  return { [searchQueryParameter]: query === '' ? null : query };
}
