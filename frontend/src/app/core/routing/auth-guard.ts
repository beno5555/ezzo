import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '../session/session-store';
import { signInAddress } from './sign-in-address';

// For signed-in addresses. A convenience for the user: the backend enforces access.
export const authGuard: CanActivateFn = (_route, state) => {
  const isSignedIn = inject(SessionStore).isSignedIn();
  if (isSignedIn) {
    return true;
  }

  return signInAddress(inject(Router), state.url);
};
