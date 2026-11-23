// The app's own addresses that code and the shell link to (the table under "Addresses" in
// .scratch/frontend/spec.md). app.routes.ts holds the patterns; this file holds the addresses.
export const appAddresses = {
  // The home address: the feed for a signed-in user, the landing page with the sign-in form for a guest.
  home: '/',
  // The composer's page, opened from the feed's Write a post button and from a refused post's toast.
  newPost: '/posts/new',
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
  // The page where a post's author edits it, opened from the post card's menu and from a refused edit's toast.
  editPost: (postId: number) => ['/posts', postId, 'edit'],
  conversation: (username: string) => ['/messages', username],
} as const;

// Paths that now lead to the home address, kept for links already sent (app.routes.ts redirects them).
export const formerHomePaths: readonly string[] = ['feed', 'sign-in'];

// The query parameter that carries the address a guard turned the user away from.
export const returnAddressParameter = 'returnUrl';

// The query parameter of the search page that carries what to search for.
export const searchQueryParameter = 'q';

// The query parameters of the search page for a query: an empty one leaves ?q= out of the address.
export function searchQueryParameters(query: string): Record<string, string | null> {
  return { [searchQueryParameter]: query === '' ? null : query };
}
