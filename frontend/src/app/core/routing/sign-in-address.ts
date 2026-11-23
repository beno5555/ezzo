import { Router, UrlTree } from '@angular/router';
import { appAddresses, returnAddressParameter } from './app-addresses';

// The landing page with its sign-in form, remembering the address the user wanted, so that sign-in can
// return there. The home address itself needs no remembering: sign-in stays on it, with whatever return
// address it already carries.
export function signInAddress(router: Router, wantedAddress: string): UrlTree {
  const wantedPath = wantedAddress.split(/[?#]/)[0];
  const isHome = wantedPath === appAddresses.home;

  return isHome
    ? router.parseUrl(wantedAddress)
    : router.createUrlTree([appAddresses.home], {
        queryParams: { [returnAddressParameter]: wantedAddress },
      });
}
