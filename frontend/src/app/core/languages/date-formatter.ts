import { Injectable, computed, inject } from '@angular/core';
import { LanguageStore } from './language-store';

const timeOptions: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' };

// A date of birth is a calendar date sent as midnight UTC; read in UTC, so nobody west of UTC sees the day before.
const dateOfBirthOptions: Intl.DateTimeFormatOptions = { dateStyle: 'long', timeZone: 'UTC' };

// The one formatter for times and dates the backend sends (UTC ISO strings, ADR 0005), in the current
// language. A template that calls it redraws when the language changes, because it reads the store.
@Injectable({ providedIn: 'root' })
export class DateFormatter {
  private readonly languageStore = inject(LanguageStore);

  private readonly timeFormat = computed(
    () => new Intl.DateTimeFormat(this.languageStore.language(), timeOptions),
  );
  private readonly dateOfBirthFormat = computed(
    () => new Intl.DateTimeFormat(this.languageStore.language(), dateOfBirthOptions),
  );

  // A moment, such as when a post was written, shown in the visitor's own time zone.
  time(isoTime: string): string {
    return this.timeFormat().format(new Date(isoTime));
  }

  dateOfBirth(isoDate: string): string {
    return this.dateOfBirthFormat().format(new Date(isoDate));
  }
}
