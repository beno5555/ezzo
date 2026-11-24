import { Location } from '@angular/common';
import { Signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { formerHomePaths } from '../routing/app-addresses';
import { landingPageMark } from '../routing/landing-page-mark';
import { routePath } from '../routing/route-path';
import { SessionStore } from '../session/session-store';

// Whether the landing page is the current page. Call it in an injection context.
//
// Before the first navigation, the browser address and restored session give the initial answer.
// After that, wait for navigation to finish so the shell and page change together.
export function isOnLandingPage(): Signal<boolean> {
  const router = inject(Router);
  const startPath = routePath(inject(Location).path()).replace(/^\//, '');
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
