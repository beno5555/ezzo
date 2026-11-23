import { Location } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';

// What a "Back" link needs to know: whether the reader reached this page from another page of the app in
// this visit. If so, Back is the browser's own Back (Location.back), which is always right about where the
// reader came from: a post opened from a profile goes back to that profile, one opened from the feed to the
// feed, and the pages never bounce between each other, because going back adds no history entry. A page
// opened directly (a shared link, a reload) has no page of the app behind it, so its link goes to the
// fallback its caller names.
//
// The router cannot say it: it knows where the reader is, not what is behind. So the store counts the
// history entries the app has added behind the page shown, from app start (provideAppInitializer):
// +1 for a navigation that adds an entry, 0 for one that replaces the current entry (the composer giving
// way to the profile after sending, a redirect), and ±1 for the browser's own Back and Forward, which the
// router reports as a "popstate" navigation (it marks those as replacing too, so the trigger is read
// first). The direction comes from the id the router keeps in every history entry: the entry restored has
// a lower id than the one left when the reader went back. A reload starts the count again from zero, so
// entries from before it are not counted: the link then goes to its fallback, which is a safe place.
@Injectable({ providedIn: 'root' })
export class NavigationHistoryStore {
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  private pagesBehind = 0;
  private shownEntryId = 0;
  private shownUrl: string | null = null;
  private hasShownAPage = false;
  private isRestoring = false;
  private restoredEntryId = 0;
  private isReplacing = false;

  follow(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.isRestoring = event.navigationTrigger === 'popstate';
        this.restoredEntryId = event.restoredState?.navigationId ?? 0;
        // Opening the address already shown reloads the page in its place (routerConfig).
        this.isReplacing =
          this.router.currentNavigation()?.extras.replaceUrl === true ||
          event.url === this.shownUrl;
      }

      if (event instanceof NavigationEnd) {
        this.show(event.id);
        this.shownUrl = event.urlAfterRedirects;
      }
    });
  }

  canGoBack(): boolean {
    return this.pagesBehind > 0;
  }

  // Back to the page the reader came from, or to the fallback when there is none.
  async goBack(fallback: string): Promise<void> {
    if (this.canGoBack()) {
      this.location.back();
    } else {
      await this.router.navigateByUrl(fallback);
    }
  }

  // The click of a "Back" link that also has an address (the fallback, as its href) so that a click with a
  // modifier key, or a middle click, still opens that address the browser's way.
  followBackLink(event: MouseEvent, fallback: string): void {
    const isPlainClick =
      event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;

    if (isPlainClick) {
      event.preventDefault();
      void this.goBack(fallback);
    }
  }

  private show(entryId: number): void {
    if (!this.hasShownAPage) {
      // The first page of the visit is the entry the browser opened the app with, not one the app added.
      this.hasShownAPage = true;
      this.shownEntryId = entryId;
    } else if (this.isRestoring) {
      const wentBack = this.restoredEntryId < this.shownEntryId;

      this.pagesBehind = Math.max(0, this.pagesBehind + (wentBack ? -1 : 1));
      this.shownEntryId = this.restoredEntryId;
    } else {
      if (!this.isReplacing) {
        this.pagesBehind++;
      }
      this.shownEntryId = entryId;
    }
  }
}
