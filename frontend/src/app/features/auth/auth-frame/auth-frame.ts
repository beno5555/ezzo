import { Component, inject, input } from '@angular/core';
import { Fretwork } from '../../../core/brand/fretwork/fretwork';
import { LanguageStore } from '../../../core/languages/language-store';

// The frame the account pages share (sign-in, register, the two password pages, reactivation): the
// heading and an optional line under it, the form on a card in a narrow column, and the links to the
// other pages below. The content goes on the card; each element with the appAuthLink attribute goes in
// the links below it. Above them all stands the brand: the wordmark on the fretwork, and the tagline,
// which always stands next to the name (PRODUCT.md). The top bar's logo already names the product to a
// screen reader, so the large wordmark is hidden from one.
@Component({
  selector: 'app-auth-frame',
  imports: [Fretwork],
  templateUrl: './auth-frame.html',
  styleUrl: './auth-frame.css',
})
export class AuthFrame {
  protected readonly text = inject(LanguageStore).text;

  readonly heading = input.required<string>();
  readonly lead = input<string>();
}
