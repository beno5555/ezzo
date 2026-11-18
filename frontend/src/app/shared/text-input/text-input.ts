import { Directive } from '@angular/core';

// The app's one text input look (DESIGN.md, Components): raised, edged in border-strong, at least 44 px
// high, with the focus ring for keyboard users. A directive, since an <input> holds no template; it
// keeps the browser's own input behaviour. Layout (width, flex) stays with the caller:
//   <input appTextInput class="flex-1" id="username" type="text" formControlName="username" />
// The visible label above it is the caller's, never a placeholder in its place.
@Directive({
  selector: 'input[appTextInput]',
  host: {
    class:
      'min-h-11 min-w-0 rounded-md border border-border-strong bg-surface-raised px-3 text-ink-strong ' +
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
  },
})
export class TextInput {}
