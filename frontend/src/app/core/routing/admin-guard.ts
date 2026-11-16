import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '../session/session-store';
import { appAddresses } from './app-addresses';
import { signInAddress } from './sign-in-address';

// For the admin addresses. A guest is sent to sign-in, a user without the role to the home address.
// A convenience for the user: the backend enforces the role.
export const adminGuard: CanActivateFn = (_route, state) => {
  const sessionStore = inject(SessionStore);
  const router = inject(Router);

  const isAdministrator = sessionStore.isAdministrator();
  if (isAdministrator) {
    return true;
  }

  const isGuest = !sessionStore.isSignedIn();
  if (isGuest) {
    return signInAddress(router, state.url);
  }

  return router.parseUrl(appAddresses.home);
};
