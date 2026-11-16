import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '../../shared/button/button';
import { LanguageStore } from '../languages/language-store';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, Button],
  templateUrl: './not-found-page.html',
  styleUrl: './not-found-page.css',
})
export class NotFoundPage {
  protected readonly text = inject(LanguageStore).text;
}
