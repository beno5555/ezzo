import { Component, input, output } from '@angular/core';
import { LucideCircleExclamationPoint } from '@lucide/angular';
import { Button } from '../button/button';

// What a list or a page shows when loading failed: the server's message in danger with an icon (colour
// never carries the meaning alone), and a quiet button to try again. Screen readers announce the message
// at once (role alert). The texts are the caller's, from its dictionary:
//   <app-load-failure [message]="feed.failureMessage()" [retryLabel]="text().posts.feed.retryButton"
//     (retry)="loadMore()" />
@Component({
  selector: 'app-load-failure',
  imports: [Button, LucideCircleExclamationPoint],
  templateUrl: './load-failure.html',
  styleUrl: './load-failure.css',
  host: { class: 'flex flex-col items-center gap-3 py-4 text-center' },
})
export class LoadFailure {
  readonly message = input.required<string>();
  readonly retryLabel = input.required<string>();
  readonly retry = output();

  requestRetry(): void {
    this.retry.emit();
  }
}
