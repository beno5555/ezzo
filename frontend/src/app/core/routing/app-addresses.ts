// The app's own addresses that code navigates to (the table under "Addresses" in .scratch/frontend/spec.md).
export const appAddresses = {
  // The home address. Ticket 26 sends a signed-in user on from here to the feed.
  home: '/',
  signIn: '/sign-in',
} as const;

// The query parameter that carries the address a guard turned the user away from.
export const returnAddressParameter = 'returnUrl';
