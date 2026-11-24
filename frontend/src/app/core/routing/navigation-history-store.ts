import { Location } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';

// The key under which every history entry the app shows carries its position.
const positionKey = 'historyPosition';

// What a "Back" link needs to know: whether the reader reached this page from another page of the app in
// this visit. If so, Back is the browser's own Back (Location.back), which is always right about where the
// reader came from: a post opened from a profile goes back to that profile, one opened from the feed to the
// feed, and the pages never bounce between each other, because going back adds no history entry. A page
// opened directly (a shared link, a reload) has no page of the app behind it, so its link goes to the
// fallback its caller names.
//
// The router cannot say it: it knows where the reader is, not what is behind. So the store numbers the
// history entries it shows, from app start (provideAppInitializer): each entry carries its position in its
// history state, one more than the entry the reader came from, or the same for a navigation that replaces
// the current entry (the composer giving way to the profile after sending, a redirect). The browser's own
// Back and Forward, and a jump over several entries, are a "popstate" navigation (the router marks those
// as replacing too, so the trigger is read first), and the entry they restore tells its own position.
// The pages behind are the positions between the first page shown and this one. The numbers are kept in
// the entries, so they stay true across a reload; the first page after a reload is where the count starts,
// so entries from before it are not counted: its link then goes to the fallback, which is a safe place.
@Injectable({ providedIn: 'root' })
export class NavigationHistoryStore {
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  private firstPosition = 0;
  private shownPosition = 0;
  private shownUrl: string | null = null;
  private hasShownAPage = false;
  private isRestoring = false;
  private restoredPosition: number | null = null;
  private isReplacing = false;

  follow(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.isRestoring = event.navigationTrigger === 'popstate';
        this.restoredPosition = readPosition(event.restoredState);
        // Opening the address already shown reloads the page in its place (routerConfig).
        this.isReplacing =
          this.router.currentNavigation()?.extras.replaceUrl === true ||
          event.url === this.shownUrl;
      }

      if (event instanceof NavigationEnd) {
        this.show();
        this.shownUrl = event.urlAfterRedirects;
      }
    });
  }

  canGoBack(): boolean {
    return this.shownPosition > this.firstPosition;
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

  private show(): void {
    if (!this.hasShownAPage) {
      // The first page of the visit is the entry the browser opened the app with (a reloaded one still
      // carries its number), not one the app added.
      this.hasShownAPage = true;
      this.shownPosition = this.restoredPosition ?? 0;
      this.firstPosition = this.shownPosition;
    } else if (this.isRestoring) {
      // An entry that carries no number was not shown by the app: nothing of the app is behind it.
      this.shownPosition = this.restoredPosition ?? this.firstPosition;
    } else {
      const addsAnEntry = !this.isReplacing;

      if (addsAnEntry) {
        this.shownPosition++;
      }
    }

    this.stampShownEntry();
  }

  // The router writes the entry's state itself, so the number is added to it once the navigation is done.
  private stampShownEntry(): void {
    const state = this.location.getState();
    const routerState = typeof state === 'object' && state !== null ? state : {};

    this.location.replaceState(this.location.path(true), '', {
      ...routerState,
      [positionKey]: this.shownPosition,
    });
  }
}

function readPosition(state: Record<string, unknown> | null | undefined): number | null {
  const position = state?.[positionKey];

  return typeof position === 'number' ? position : null;
}
