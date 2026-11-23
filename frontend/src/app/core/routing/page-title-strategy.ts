import { Injectable, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { LanguageStore } from '../languages/language-store';
import { PageTitleKey, isPageTitleKey } from './page-title-key';

// Names the browser tab "<page> – Ezzo" from the route's title, which is a key of the dictionary's
// pages group. It keeps the key, not the text, so a language switch renames the tab in place.
@Injectable()
export class PageTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly languageStore = inject(LanguageStore);
  private readonly currentKey = signal<PageTitleKey | null>(null);

  constructor() {
    super();
    effect(() => {
      const text = this.languageStore.text();
      const key = this.currentKey();
      const tabTitle = key === null ? text.app.name : `${text.pages[key]} – ${text.app.name}`;
      this.title.setTitle(tabTitle);
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const routeTitle = this.buildTitle(snapshot);
    const isKnownKey = isPageTitleKey(this.languageStore.text().pages, routeTitle);
    this.currentKey.set(isKnownKey ? routeTitle : null);
  }
}
