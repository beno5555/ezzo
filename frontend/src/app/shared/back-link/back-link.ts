import { Component, inject, input } from '@angular/core';
import { LucideArrowLeft } from '@lucide/angular';
import { appAddresses } from '../../core/routing/app-addresses';
import { NavigationHistoryStore } from '../../core/routing/navigation-history-store';
import { Button } from '../button/button';

// The "Back" link of a page, pinned while the reader scrolls: on a phone and a tablet a slim bar across the
// top of the column, from 1024 px a link in the margin left of the column that keeps its place beside the
// reader. It goes back to the page the reader came from, and to the feed when the page was opened
// directly (NavigationHistoryStore says how). The text is the caller's, from its dictionary. The page's own
// wrapper must be `relative` (the margin position is measured from it), and the host adds no box of its
// own so that the pinning works against that wrapper:
//   <div class="relative flex flex-col gap-6">
//     <app-back-link [label]="text().posts.page.backLink" />
@Component({
  selector: 'app-back-link',
  imports: [Button, LucideArrowLeft],
  templateUrl: './back-link.html',
  styleUrl: './back-link.css',
  host: { class: 'contents' },
})
export class BackLink {
  private readonly history = inject(NavigationHistoryStore);

  readonly label = input.required<string>();

  protected readonly feedAddress = appAddresses.home;

  protected follow(event: MouseEvent): void {
    this.history.followBackLink(event, this.feedAddress);
  }
}
