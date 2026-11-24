import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { SessionStore } from '../session/session-store';

// For an address whose page depends on who opens it: the route is passed over for a guest, so the next
// route with the same path answers.
export const signedInMatch: CanMatchFn = () => inject(SessionStore).isSignedIn();
