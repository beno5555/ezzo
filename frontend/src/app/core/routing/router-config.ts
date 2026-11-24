import { RouterConfigOptions } from '@angular/router';

// "/" shows the landing page or the feed by who is signed in, so a navigation to the address already open
// chooses the page again: after signing in or out there, and from a link to it.
export const routerConfig = {
  onSameUrlNavigation: 'reload',
} as const satisfies RouterConfigOptions;
