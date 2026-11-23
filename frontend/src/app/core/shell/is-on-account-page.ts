import { Location } from '@angular/common';
import { Signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, isActive } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { appAddresses } from '../routing/app-addresses';

// The account pages beside the landing page (isOnLandingPage): a short stop on the way in, so the shell
// around them keeps only the logo (owner, 2026-11-19). The language starts from the browser's
// (LanguageStore), and the other pages keep the switch.
const accountPageAddresses: readonly string[] = [
  appAddresses.register,
  appAddresses.forgotPassword,
  appAddresses.resetPassword,
  appAddresses.reactivateAccount,
];

// Whether the current page is an account page. Call it in an injection context.
//
// Until the first navigation ends, the router's address is still "/", so the answer comes from the
// browser's address instead. Without that, a page opened from outside (the reset email's link) would
// show the full top bar for a moment.
export function isOnAccountPage(): Signal<boolean> {
  const router = inject(Router);
  const startPath = inject(Location).path().split(/[?#]/)[0];
  const startedOnAccountPage = accountPageAddresses.includes(startPath);
  const hasNavigated = toSignal(
    router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      take(1),
      map(() => true),
    ),
    { initialValue: router.navigated },
  );
  const matches = accountPageAddresses.map((address) =>
    isActive(address, router, { paths: 'exact', queryParams: 'ignored' }),
  );
  return computed(() =>
    hasNavigated() ? matches.some((isOnPage) => isOnPage()) : startedOnAccountPage,
  );
}
