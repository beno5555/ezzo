import { Directive } from '@angular/core';

// A row in a shell menu's panel, a link or a button: an icon and a word, 44 px high (a touch target),
// sunken while hovered, with the focus ring inside its edge. A directive, so the element keeps its own
// behaviour:
//   <a appMenuRow [routerLink]="addresses.settings"><svg [appIcon]="icons.settings"></svg> Settings</a>
@Directive({
  selector: 'a[appMenuRow], button[appMenuRow]',
  host: {
    class:
      'flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 text-start ' +
      'hover:bg-surface-sunken focus-visible:outline-2 focus-visible:-outline-offset-2 ' +
      'focus-visible:outline-focus',
  },
})
export class MenuRow {}
