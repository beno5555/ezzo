import { Component, computed, input } from '@angular/core';
import { ButtonLook } from './button-look';

// Every look a button shares: at least 44 px high (a touch target), the md radius, the focus ring
// for keyboard users only, and short colour changes that "reduce motion" turns off.
const sharedClasses =
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border px-4 ' +
  'text-base font-semibold transition-colors motion-reduce:transition-none ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ' +
  'disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-sunken disabled:text-ink-muted';

// Hover and press change colour only on a button that is not disabled, so a disabled one stays grey.
// not-disabled: rather than enabled:, because :enabled never matches an <a>.
const lookClasses: Record<ButtonLook, string> = {
  [ButtonLook.Primary]:
    'border-accent bg-accent text-on-accent ' +
    'not-disabled:hover:border-accent-strong not-disabled:hover:bg-accent-strong ' +
    'not-disabled:active:border-accent-strong not-disabled:active:bg-accent-strong',
  [ButtonLook.Quiet]:
    'border-border-strong bg-surface-raised text-ink-strong ' +
    'not-disabled:hover:bg-surface-sunken not-disabled:active:bg-surface-sunken',
  [ButtonLook.Danger]:
    'border-danger bg-surface-raised text-danger ' +
    'not-disabled:hover:bg-surface-sunken not-disabled:active:bg-surface-sunken',
};

// The app's one button look. It sits on a native <button>, so type, disabled, form submission and
// keyboard behaviour stay the browser's own:
//   <button appButton look="primary" type="submit" [disabled]="form.invalid">...</button>
// On an <a routerLink> it gives a link that is a screen's main action the same look.
// An icon goes inside, beside the text. An icon that is the only content needs an aria-label.
@Component({
  selector: 'button[appButton], a[appButton]',
  templateUrl: './button.html',
  styleUrl: './button.css',
  host: { '[class]': 'classes()' },
})
export class Button {
  readonly look = input.required<ButtonLook>();

  protected readonly classes = computed(() => `${sharedClasses} ${lookClasses[this.look()]}`);
}
