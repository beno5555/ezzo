import { CdkTrapFocus } from '@angular/cdk/a11y';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { Component, input, signal } from '@angular/core';
import { IconButton } from '../../../shared/icon-button/icon-button';

// The panel opens under its button, aligned to its end edge (the button sits at the end of the top bar),
// and above it when there is no room below.
const positions: ConnectedPosition[] = [
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom' },
];

// The least room, in pixels, the panel keeps from the edges of the window, so it never touches them at 360 px.
const viewportMargin = 8;

// A button in the top bar that opens a panel of links and switches: the user's menu, and a guest's
// language and theme. It is not the shared "…" Menu, whose list may hold only menu items; this panel
// holds links, toggle buttons and a sign-out button, so it is a small dialog. Its behaviour comes from
// Angular CDK: the focus moves into the panel and stays there, Escape or a click outside closes it, and
// the focus goes back to the button. The trigger's content and the panel's content are the caller's:
//   <app-shell-popover #menu [label]="text().shell.userMenuLabel">
//     <app-avatar appPopoverTrigger ... />
//     <a routerLink="/settings" (click)="menu.close()">...</a>
//   </app-shell-popover>
// A link in the panel calls close(), because a navigation inside the app does not close the overlay.
@Component({
  selector: 'app-shell-popover',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, CdkTrapFocus, IconButton],
  templateUrl: './shell-popover.html',
  styleUrl: './shell-popover.css',
})
export class ShellPopover {
  // Names the button and the panel for screen readers.
  readonly label = input.required<string>();

  protected readonly isOpen = signal(false);
  protected readonly positions = positions;
  protected readonly viewportMargin = viewportMargin;

  toggle(): void {
    this.isOpen.update((isOpen) => !isOpen);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
