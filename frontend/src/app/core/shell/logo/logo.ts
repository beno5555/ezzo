import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageStore } from '../../languages/language-store';
import { appAddresses } from '../../routing/app-addresses';

// The product's name as a link to the home address. Until the name and the brand are chosen, the brand
// lives here and in the design token values only (DESIGN.md, Overview), so a new name changes one file.
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
