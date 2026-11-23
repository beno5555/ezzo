import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageStore } from '../../languages/language-store';
import { appAddresses } from '../../routing/app-addresses';

// The wordmark as a link to the home address: the product's name, all lowercase ("ezzo",
// PRODUCT.md), in the display face and the accent. The name itself comes from the dictionary, where
// every other text reads it too.
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
