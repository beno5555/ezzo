import { Component } from '@angular/core';

// A button whose only content is an icon, such as a dialog's close button and a menu's "…" button: a
// 44 px square (a touch target), muted until hovered, with the focus ring for keyboard users and colour
// changes that "reduce motion" turns off. An icon alone says nothing to a screen reader, so the caller
// gives the button an aria-label from the dictionary:
//   <button appIconButton type="button" [attr.aria-label]="text().shared.dialog.closeButton">
//     <svg class="size-5" lucideX aria-hidden="true"></svg>
//   </button>
@Component({
  selector: 'button[appIconButton]',
  templateUrl: './icon-button.html',
  styleUrl: './icon-button.css',
  host: {
    class:
      'inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-ink-muted ' +
      'transition-colors hover:bg-surface-sunken hover:text-ink-strong motion-reduce:transition-none ' +
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
  },
})
export class IconButton {}
