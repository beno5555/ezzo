import { Directive, inject } from '@angular/core';
import { FormField } from '../form-field/form-field';

// The app's one text input look (DESIGN.md, Components): raised, edged in border-strong, at least 44 px
// high, with the focus ring for keyboard users. A directive, since an <input> holds no template; it
// keeps the browser's own input behaviour. Layout (width, flex) stays with the caller:
//   <input appTextInput class="flex-1" id="username" type="text" formControlName="username" />
// The visible label above it is the caller's, never a placeholder in its place. Inside an
// app-form-field it takes its error state from the field: the edge turns danger, and screen readers
// hear the hint and the error after the label.
@Directive({
  selector: 'input[appTextInput], textarea[appTextInput]',
  host: {
    class:
      'min-h-11 min-w-0 rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-ink-strong ' +
      'aria-invalid:border-danger ' +
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
    '[attr.aria-invalid]': 'showsError()',
    '[attr.aria-describedby]': 'field?.describedBy() ?? null',
  },
})
export class TextInput {
  protected readonly field = inject(FormField, { optional: true });

  // aria-invalid is left out, not "false", while no error shows.
  protected showsError(): true | null {
    return this.field?.errorMessage() ? true : null;
  }
}
