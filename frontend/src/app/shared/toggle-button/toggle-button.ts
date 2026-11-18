import { Component, input } from '@angular/core';

// One choice of a group that keeps one choice on, such as the language and theme switches. The pressed
// one is marked in accent and announced to screen readers through aria-pressed:
//   <button appToggleButton type="button" [pressed]="isCurrent(x)" (click)="choose(x)">...</button>
// At least 44 px high, the focus ring for keyboard users only, and colour changes that "reduce motion"
// turns off, as on a Button.
@Component({
  selector: 'button[appToggleButton]',
  templateUrl: './toggle-button.html',
  styleUrl: './toggle-button.css',
  host: {
    class:
      'min-h-11 cursor-pointer rounded-md border border-border-strong bg-surface-raised px-3 text-sm ' +
      'font-semibold text-ink-strong transition-colors not-aria-pressed:hover:bg-surface-sunken ' +
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ' +
      'aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-on-accent ' +
      'motion-reduce:transition-none',
    '[attr.aria-pressed]': 'pressed()',
  },
})
export class ToggleButton {
  readonly pressed = input.required<boolean>();
}
