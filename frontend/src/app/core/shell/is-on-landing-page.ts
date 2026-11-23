import { Location } from '@angular/common';
import { Signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { formerHomePaths } from '../routing/app-addresses';
import { landingPageMark } from '../routing/landing-page-mark';
import { SessionStore } from '../session/session-store';

// Whether the landing page is the current page. Call it in an injection context.
//
// It follows the page the router opened, not the session, so the shell changes together with the page and
// not a moment before it, while the next page still loads. Until the first navigation ends there is no such
// page, so the answer comes from the browser's address and the session, which is restored by then.
export function isOnLandingPage(): Signal<boolean> {
  const router = inject(Router);
  const startPath = inject(Location).path().split(/[?#]/)[0].replace(/^\//, '');
  const isGuest = !inject(SessionStore).isSignedIn();

  const startsAtHome = startPath === '' || formerHomePaths.includes(startPath);

  return toSignal(
    router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => showsLandingPage(router)),
    ),
    { initialValue: router.navigated ? showsLandingPage(router) : startsAtHome && isGuest },
  );
}

function showsLandingPage(router: Router): boolean {
  return router.routerState.snapshot.root.firstChild?.data[landingPageMark] === true;
}
