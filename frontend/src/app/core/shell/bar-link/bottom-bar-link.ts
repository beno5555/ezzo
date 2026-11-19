import { Directive, inject } from '@angular/core';
import { RouterLinkActive } from '@angular/router';
import { markActiveBarLink } from './active-bar-link';

// A link in the phone's bottom bar: an icon over a short word, filling its fifth of the bar, muted until
// it leads to the current page. A word too long for its fifth is cut with an ellipsis. The caller puts
// the routerLink beside it:
//   <a appBottomBarLink [routerLink]="addresses.feed"><svg lucideHouse ...></svg><span>Feed</span></a>
@Directive({
  selector: 'a[appBottomBarLink]',
  hostDirectives: [RouterLinkActive],
  host: {
    class:
      'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-xs text-ink-muted ' +
      'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
  },
})
export class BottomBarLink {
  constructor() {
    markActiveBarLink(inject(RouterLinkActive, { self: true }));
  }
}
