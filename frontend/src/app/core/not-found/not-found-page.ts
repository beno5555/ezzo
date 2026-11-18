import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideMapPinOff } from '@lucide/angular';
import { Button } from '../../shared/button/button';
import { LanguageStore } from '../languages/language-store';
import { appAddresses } from '../routing/app-addresses';

// The page at any address the route table does not know.
@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, Button, LucideMapPinOff],
  templateUrl: './not-found-page.html',
  styleUrl: './not-found-page.css',
})
export class NotFoundPage {
  protected readonly text = inject(LanguageStore).text;
  protected readonly homeAddress = appAddresses.home;
}
