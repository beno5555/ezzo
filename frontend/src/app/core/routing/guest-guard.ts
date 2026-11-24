import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '../session/session-store';
import { appAddresses } from './app-addresses';

// For register, which a signed-in user does not need.
export const guestGuard: CanActivateFn = () => {
  const isGuest = !inject(SessionStore).isSignedIn();
  if (isGuest) {
    return true;
  }

  return inject(Router).parseUrl(appAddresses.home);
};
