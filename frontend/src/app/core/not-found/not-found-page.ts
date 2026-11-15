import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageStore } from '../languages/language-store';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  templateUrl: './not-found-page.html',
  styleUrl: './not-found-page.css',
})
export class NotFoundPage {
  protected readonly text = inject(LanguageStore).text;
}
