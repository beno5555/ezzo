import { RouterLinkActive } from '@angular/router';

// How a bar's link marks the page the visitor is on: a sunken pill and bold text, which is a shape and a
// weight, not a colour alone (DESIGN.md, Colors), and aria-current="page" for screen readers.
export const activeBarLinkClasses = 'bg-surface-sunken font-semibold text-ink-strong';

export function markActiveBarLink(routerLinkActive: RouterLinkActive): void {
  routerLinkActive.routerLinkActive = activeBarLinkClasses;
  routerLinkActive.ariaCurrentWhenActive = 'page';
}
