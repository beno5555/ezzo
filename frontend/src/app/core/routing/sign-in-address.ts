import { Router, UrlTree } from '@angular/router';
import { appAddresses, returnAddressParameter } from './app-addresses';

// The sign-in page, remembering the address the user wanted, so that sign-in can return there.
export function signInAddress(router: Router, wantedAddress: string): UrlTree {
  return router.createUrlTree([appAddresses.signIn], {
    queryParams: { [returnAddressParameter]: wantedAddress },
  });
}
