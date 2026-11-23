import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { LanguageStore } from '../../../core/languages/language-store';

// The frame the account pages share (the landing page, register, the two password pages, reactivation): the
// heading and an optional line under it, the form on a card in a narrow column, and the links to the
// other pages below. The content goes on the card; each element with the appAuthLink attribute goes in
// the links below it. A lifted frame (the landing page) puts the heading on the card and the card on an
// accent sheet set askew, so the form stands out beside the picture; it shows no lead.
@Component({
  selector: 'app-auth-frame',
  imports: [NgTemplateOutlet],
  templateUrl: './auth-frame.html',
  styleUrl: './auth-frame.css',
})
export class AuthFrame {
  protected readonly text = inject(LanguageStore).text;

  readonly heading = input.required<string>();
  readonly lead = input<string>();
  readonly lifted = input(false);
}
