import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { Component, inject, input } from '@angular/core';
import LucideEllipsis from 'lucide/dist/esm/icons/ellipsis.mjs';
import { LanguageStore } from '../../core/languages/language-store';
import { IconButton } from '../icon-button/icon-button';
import { Icon } from '../icon/icon';
import { MenuEntry } from './menu-entry';

// The list opens under the "…" button, aligned to its end edge (the button sits at the end of a post, a
// comment or a profile), and above it when there is no room below.
const positions: ConnectedPosition[] = [
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom' },
];

// The "…" menu on posts, comments and profiles, with the behaviour of Angular CDK's menu: Enter, Space
// or the down arrow opens it on its first entry, the arrows, Home and End move, a letter jumps to the
// entry it starts, Enter or Space chooses, and Escape or Tab closes it with the focus back on the button.
// The entries are the caller's, who decides which the viewer may see:
//   <app-menu [entries]="menuEntries()" [label]="text().posts.menuLabel" />
// label names the button for screen readers; without one it is "More actions".
@Component({
  imports: [CdkMenu, CdkMenuItem, CdkMenuTrigger, IconButton, Icon],
  selector: 'app-menu',
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu {
  protected readonly icons = { ellipsis: LucideEllipsis };

  protected readonly text = inject(LanguageStore).text;
  protected readonly positions = positions;

  readonly entries = input.required<readonly MenuEntry[]>();
  readonly label = input<string>();

  choose(entry: MenuEntry): void {
    entry.choose();
  }
}
