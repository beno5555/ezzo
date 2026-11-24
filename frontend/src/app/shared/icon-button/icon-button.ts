import { Component, computed, input } from '@angular/core';
import { IconButtonLook } from './icon-button-look';

// Every look shares a 44 px square (a touch target), the focus ring for keyboard users and colour
// changes that "reduce motion" turns off.
const sharedClasses =
  'inline-flex size-11 shrink-0 cursor-pointer items-center justify-center ' +
  'transition-colors motion-reduce:transition-none ' +
  'disabled:cursor-not-allowed disabled:opacity-50 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

// On a photo, the square stays clear and only a small raised disc in its middle shows; the disc darkens
// on hover in place of the square.
const lookClasses: Record<IconButtonLook, { button: string; disc: string }> = {
  [IconButtonLook.Plain]: {
    button: 'rounded-md text-ink-muted hover:bg-surface-sunken hover:text-ink-strong',
    disc: 'contents',
  },
  [IconButtonLook.OnPhoto]: {
    button: 'group rounded-full text-ink-strong',
    disc:
      'flex size-7 items-center justify-center rounded-full bg-surface-raised shadow-raised ' +
      'transition-colors group-hover:bg-surface-sunken motion-reduce:transition-none',
  },
};

// A button whose only content is an icon, such as a dialog's close button and a menu's "…" button:
// muted until hovered. An icon alone says nothing to a screen reader, so the caller gives the button an
// aria-label from the dictionary:
//   <button appIconButton type="button" [attr.aria-label]="text().shared.dialog.closeButton">
//     <svg class="size-5" [appIcon]="icons.x" aria-hidden="true"></svg>
//   </button>
// Over a photo (the photo picker's remove buttons), look="on-photo" shows a small disc and keeps the
// full square as the place a finger can tap; its icon is size-4.
@Component({
  selector: 'button[appIconButton]',
  templateUrl: './icon-button.html',
  styleUrl: './icon-button.css',
  host: { '[class]': 'buttonClasses()' },
})
export class IconButton {
  readonly look = input<IconButtonLook>(IconButtonLook.Plain);

  protected readonly buttonClasses = computed(
    () => `${sharedClasses} ${lookClasses[this.look()].button}`,
  );
  protected readonly discClasses = computed(() => lookClasses[this.look()].disc);
}
