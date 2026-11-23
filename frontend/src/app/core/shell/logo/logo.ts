import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoMark } from '../../../shared/logo-mark/logo-mark';
import { LanguageStore } from '../../languages/language-store';
import { appAddresses } from '../../routing/app-addresses';

// The logo as a link to the home address. The name is read to screen readers only; it comes from the
// dictionary.
@Component({
  selector: 'app-logo',
  imports: [LogoMark, RouterLink],
  templateUrl: './logo.html',
  styleUrl: './logo.css',
})
export class Logo {
  protected readonly text = inject(LanguageStore).text;
  protected readonly homeAddress = appAddresses.home;
}
