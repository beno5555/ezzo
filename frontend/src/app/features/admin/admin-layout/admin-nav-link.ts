import { Directive, inject } from '@angular/core';
import { RouterLinkActive } from '@angular/router';
import { ActiveBarEdge } from '../../../core/shell/bar-link/active-bar-edge';
import { markActiveBarLink } from '../../../core/shell/bar-link/active-bar-link';

// A link in the admin panel's navigation: an icon and a word, 44 px high, muted until it is hovered or
// leads to the current area, which is marked as the shell's bars mark theirs. The caller puts the
// routerLink beside it:
//   <a appAdminNavLink [routerLink]="[addresses.admin, 'users']"><svg lucideUsers ...></svg> Users</a>
@Directive({
  selector: 'a[appAdminNavLink]',
  hostDirectives: [RouterLinkActive],
  host: {
    class:
      'relative flex min-h-11 items-center gap-3 rounded-md px-3 text-ink-muted ' +
      'hover:bg-surface-sunken hover:text-ink-strong ' +
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
  },
})
export class AdminNavLink {
  constructor() {
    markActiveBarLink(inject(RouterLinkActive, { self: true }), ActiveBarEdge.Start);
  }
}
