import { Component, inject, input } from '@angular/core';
import { DateFormatter } from '../../core/languages/date-formatter';
import { LanguageStore } from '../../core/languages/language-store';

// Whether a friend is online, beside their name: a dot with the word "Online", so the colour is never the
// only sign, or the last time they were active. lastActiveAt is null while the friend is online, as the
// friend rows and PresenceStore give it.
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
