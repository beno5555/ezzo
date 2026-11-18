import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LanguageStore } from '../languages/language-store';
import { isPageTitleKey } from '../routing/page-title-key';

// Stands at an address whose page is not built yet, named by the route's title. Each page's ticket
// replaces it in app.routes.ts.
@Component({
  selector: 'app-page-placeholder',
  templateUrl: './page-placeholder.html',
  styleUrl: './page-placeholder.css',
})
export class PagePlaceholder {
  private readonly routeTitle = inject(ActivatedRoute).snapshot.title;

  protected readonly text = inject(LanguageStore).text;
  protected readonly heading = computed(() => {
    const pages = this.text().pages;
    return isPageTitleKey(pages, this.routeTitle) ? pages[this.routeTitle] : this.text().app.name;
  });
}
