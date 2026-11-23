import { RouterLinkActive } from '@angular/router';
import { ActiveBarEdge } from './active-bar-edge';

const edgeClasses: Record<ActiveBarEdge, string> = {
  [ActiveBarEdge.Bottom]: 'after:inset-x-3 after:bottom-0 after:h-0.5',
  [ActiveBarEdge.Top]: 'after:inset-x-4 after:top-0 after:h-0.5',
  [ActiveBarEdge.Start]: 'after:inset-y-2 after:start-0 after:w-0.5',
};

// How a bar's link marks the page the visitor is on: accent text, bold, and a short bar along one
// edge, which is a shape and a weight, not a colour alone (DESIGN.md, Colors), and aria-current="page"
// for screen readers. The link's host carries "relative", so the bar sits on the link itself.
export function markActiveBarLink(routerLinkActive: RouterLinkActive, edge: ActiveBarEdge): void {
  routerLinkActive.routerLinkActive =
    'font-semibold text-accent after:absolute after:rounded-full after:bg-accent ' +
    edgeClasses[edge];
  routerLinkActive.ariaCurrentWhenActive = 'page';
}
