import { IsActiveMatchOptions } from '@angular/router';

// When a bar's link to the home address is the current page: on that address alone, whatever its query.
// By default a link is current on every address under its own, which for "/" is all of them.
export const homeLinkMatch: IsActiveMatchOptions = {
  paths: 'exact',
  queryParams: 'ignored',
  matrixParams: 'ignored',
  fragment: 'ignored',
};
