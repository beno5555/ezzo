import { Directive, inject } from '@angular/core';
import { RouterLinkActive } from '@angular/router';
import { markActiveBarLink } from './active-bar-link';

// A link in the top bar's navigation: an icon, a word and maybe a count, 44 px high, muted until it is
// hovered or leads to the current page. The caller puts the routerLink beside it:
//   <a appTopBarLink [routerLink]="addresses.feed"><svg lucideHouse ...></svg> Feed</a>
@Directive({
  selector: 'a[appTopBarLink]',
  hostDirectives: [RouterLinkActive],
  host: {
    class:
      'flex min-h-11 items-center gap-2 rounded-md px-3 whitespace-nowrap text-ink-muted ' +
      'hover:bg-surface-sunken hover:text-ink-strong ' +
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
  },
})
export class TopBarLink {
  constructor() {
    markActiveBarLink(inject(RouterLinkActive, { self: true }));
  }
}
