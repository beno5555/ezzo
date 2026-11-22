import { Component, inject, input } from '@angular/core';
import { DateFormatter } from '../../core/languages/date-formatter';
import { LanguageStore } from '../../core/languages/language-store';

// Whether a friend is online, in words, under their name where there is room (the open conversation's
// header): a green dot with "Active now", or a grey one with "Active 5 minutes ago", so the colour is never
// the only sign. lastActiveAt is null while the friend is online, as the friend rows and PresenceStore give
// it. A list row has the compact form, PresenceDot.
//   <app-presence-label [lastActiveAt]="friend.lastActiveAt" />
@Component({
  selector: 'app-presence-label',
  templateUrl: './presence-label.html',
  styleUrl: './presence-label.css',
})
export class PresenceLabel {
  readonly lastActiveAt = input.required<string | null>();

  protected readonly text = inject(LanguageStore).text;
  protected readonly dateFormatter = inject(DateFormatter);
}
