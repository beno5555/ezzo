import { Component, inject } from '@angular/core';
import { LucideLoaderCircle } from '@lucide/angular';
import { LanguageStore } from '../../core/languages/language-store';

// The "Deleting…" a post, a comment, a message or a friend's row shows while the server has not answered a
// deletion (DeleteFade.isWaiting). The spinner stands still under prefers-reduced-motion:
//   @if (isWaiting()) { <app-deleting-notice /> }
@Component({
  selector: 'app-deleting-notice',
  imports: [LucideLoaderCircle],
  templateUrl: './deleting-notice.html',
  styleUrl: './deleting-notice.css',
  host: { class: 'flex items-center gap-2 text-sm text-ink-muted', role: 'status' },
})
export class DeletingNotice {
  protected readonly text = inject(LanguageStore).text;
}
