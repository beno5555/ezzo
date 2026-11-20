import { Component } from '@angular/core';

// A quiet action in a row of them, such as a post card's like button and its link to the comments: an
// icon and a short text or count, at least 44 px high (a touch target), muted until hovered, with the focus
// ring for keyboard users and colour changes that "reduce motion" turns off. A pressed button is shown in
// accent, and one marked aria-disabled shows the waiting cursor.
//   <button appActionButton type="button" [attr.aria-pressed]="isLiked">...</button>
//   <a appActionButton [routerLink]="address">...</a>
@Component({
  selector: 'button[appActionButton], a[appActionButton]',
  templateUrl: './action-button.html',
  styleUrl: './action-button.css',
  host: {
    class:
      'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-3 text-sm font-semibold ' +
      'text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink-strong ' +
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ' +
      'aria-disabled:cursor-wait aria-pressed:text-accent motion-reduce:transition-none',
  },
})
export class ActionButton {}
