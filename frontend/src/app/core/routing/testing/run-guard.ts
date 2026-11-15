import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { SessionStore } from '../../session/session-store';
import { GuardSession } from './guard-session';

// Runs a guard for a visit to wantedAddress with the given session. Gives back the address the guard
// sends the user to, or true when it lets the user through.
export function runGuard(
  guard: CanActivateFn,
  session: GuardSession,
  wantedAddress: string,
): string | boolean {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: SessionStore,
        useValue: {
          isSignedIn: signal(session.isSignedIn),
          isAdministrator: signal(session.isAdministrator),
        },
      },
    ],
  });
  const router = TestBed.inject(Router);
  const state = { url: wantedAddress } as RouterStateSnapshot;

  const decision = TestBed.runInInjectionContext(() => guard({} as ActivatedRouteSnapshot, state));

  const isRedirect = decision instanceof UrlTree;
  return isRedirect ? router.serializeUrl(decision) : decision === true;
}
