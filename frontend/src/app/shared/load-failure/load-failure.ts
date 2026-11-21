import { Component, input, output } from '@angular/core';
import { LucideCircleExclamationPoint } from '@lucide/angular';
import { Button } from '../button/button';

// A read that failed, where its content would be: the server's message, announced at once (role alert),
// with an icon so that colour never carries the meaning alone, and a quiet button that tries again. The
// caller gives the space around it.
//   <app-load-failure class="py-4" [message]="failureMessage()" [retryLabel]="retryText" (retry)="loadMore()" />
@Component({
  selector: 'app-load-failure',
  imports: [Button, LucideCircleExclamationPoint],
  templateUrl: './load-failure.html',
  styleUrl: './load-failure.css',
  host: { class: 'flex flex-col items-center gap-3 text-center' },
})
export class LoadFailure {
  readonly message = input.required<string | null>();
  readonly retryLabel = input.required<string>();
  readonly retry = output();
}
