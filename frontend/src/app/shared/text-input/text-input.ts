import { Directive, ElementRef, inject } from '@angular/core';
import { FormField } from '../form-field/form-field';

// The box of an input inside an app-form-field: taller, with room at the top for the label that floats
// up into it (the field's template), and marked as the peer the label follows.
const inFieldClass = 'peer min-h-14 pt-6 pb-1.5';
// The box of an input standing alone, such as the shell's search bar.
const aloneClass = 'min-h-11 py-2';

// The app's one text input look (DESIGN.md, Components): raised, edged in border-strong, at least 44 px
// high, with the focus ring for keyboard users. A directive, since an <input> holds no template; it
// keeps the browser's own input behaviour. Layout (width, flex) stays with the caller:
//   <input appTextInput class="flex-1" id="username" type="text" formControlName="username" />
// Inside an app-form-field its label floats in the box (the field's template) and it takes its error
// state from the field: the edge turns danger, and screen readers hear the hint and the error after the
// label. Standing alone, its label is the caller's.
@Directive({
  selector: 'input[appTextInput], textarea[appTextInput]',
  host: {
    class:
      'min-w-0 rounded-md border border-border-strong bg-surface-raised px-3 text-ink-strong ' +
      'aria-invalid:border-danger ' +
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
    '[class]': 'boxClass',
    '[attr.aria-invalid]': 'showsError()',
    '[attr.aria-describedby]': 'field?.describedBy() ?? null',
  },
})
export class TextInput {
  protected readonly field = inject(FormField, { optional: true });
  protected readonly boxClass = this.field === null ? aloneClass : inFieldClass;

  constructor() {
    const element =
      inject<ElementRef<HTMLInputElement | HTMLTextAreaElement>>(ElementRef).nativeElement;
    const needsBlankPlaceholder = this.field !== null && element.placeholder === '';

    // The floating label rests in the box while the placeholder shows (:placeholder-shown), so an input
    // in a field needs one, even a blank one. A date input has none, so its label always sits up.
    if (needsBlankPlaceholder) {
      element.placeholder = ' ';
    }
  }

  // aria-invalid is left out, not "false", while no error shows.
  protected showsError(): true | null {
    return this.field?.errorMessage() ? true : null;
  }
}
