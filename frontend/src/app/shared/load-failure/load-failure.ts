import { Component, input, output } from '@angular/core';
import LucideCircleExclamationPoint from 'lucide/dist/esm/icons/circle-exclamation-point.mjs';
import { Button } from '../button/button';
import { Icon } from '../icon/icon';

// What a list or a page shows when loading failed: the server's message in danger with an icon (colour
// never carries the meaning alone), and a quiet button to try again. Screen readers announce the message
// at once (role alert). The texts are the caller's, from its dictionary:
//   <app-load-failure [message]="feed.failureMessage()" [retryLabel]="text().posts.feed.retryButton"
//     (retry)="loadMore()" />
@Component({
  selector: 'app-load-failure',
  imports: [Button, Icon],
  templateUrl: './load-failure.html',
  styleUrl: './load-failure.css',
  host: { class: 'flex flex-col items-center gap-3 py-4 text-center' },
})
export class LoadFailure {
  protected readonly icons = { circleExclamationPoint: LucideCircleExclamationPoint };

  readonly message = input.required<string>();
  readonly retryLabel = input.required<string>();
  readonly retry = output();

  requestRetry(): void {
    this.retry.emit();
  }
}
