import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageStore } from '../../languages/language-store';
import { appAddresses } from '../../routing/app-addresses';

// The logo as a link to the home address: the "zz" speech-bubble mark (DESIGN.md, Brand), the same
// drawing as the browser-tab icon (public/favicon.svg). The name is read to screen readers only; it
// comes from the dictionary.
@Component({
  selector: 'app-logo',
  imports: [RouterLink],
  templateUrl: './logo.html',
  styleUrl: './logo.css',
})
export class Logo {
  protected readonly text = inject(LanguageStore).text;
  protected readonly homeAddress = appAddresses.home;
}
