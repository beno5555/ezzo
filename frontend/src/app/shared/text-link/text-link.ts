import { Directive } from '@angular/core';

// The app's one look for a link in text or beside a form (DESIGN.md: links are accent): underlined, so it
// reads as a link without its colour; the focus ring for keyboard users; at least 44 px high, a touch
// target. It sits on an <a>, so routerLink and the browser's own link behaviour stay:
//   <a appTextLink [routerLink]="registerAddress">Register</a>
// A control that acts in place and goes nowhere ("See more") is a <button> with the same look.
// A link that is a screen's main action takes the Button look instead.
@Directive({
  selector: 'a[appTextLink], button[appTextLink]',
  host: {
    class:
      'inline-flex min-h-11 cursor-pointer items-center rounded-sm font-semibold text-accent underline ' +
      'underline-offset-2 hover:text-accent-strong ' +
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
  },
})
export class TextLink {}
