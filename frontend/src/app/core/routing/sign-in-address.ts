import { Router, UrlTree } from '@angular/router';
import { appAddresses, returnAddressParameter } from './app-addresses';
import { routePath } from './route-path';

// A request for home can already carry a return address. Keep it instead of wrapping home in another
// returnUrl.
export function signInAddress(router: Router, wantedAddress: string): UrlTree {
  const isHome = routePath(wantedAddress) === appAddresses.home;

  return isHome
    ? router.parseUrl(wantedAddress)
    : router.createUrlTree([appAddresses.home], {
        queryParams: { [returnAddressParameter]: wantedAddress },
      });
}
