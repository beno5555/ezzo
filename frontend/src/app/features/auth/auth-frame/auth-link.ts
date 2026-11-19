import { Directive } from '@angular/core';

// One line of links under an account page's card ("No account yet? Register"). AuthFrame places each
// element that carries the attribute under its card; this directive gives the line its look, so the
// pages only write <p appAuthLink>.
@Directive({
  selector: '[appAuthLink]',
  host: { class: 'flex flex-wrap items-center gap-x-1' },
})
export class AuthLink {}
