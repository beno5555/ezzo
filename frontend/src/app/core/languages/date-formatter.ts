import { Injectable, computed, inject } from '@angular/core';
import { LanguageStore } from './language-store';

const timeOptions: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' };

// The three forms of a short time (shortTime).
const todayOptions: Intl.DateTimeFormatOptions = { timeStyle: 'short' };
const thisYearOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
const earlierYearOptions: Intl.DateTimeFormatOptions = { dateStyle: 'medium' };

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
  private readonly todayFormat = computed(
    () => new Intl.DateTimeFormat(this.languageStore.language(), todayOptions),
  );
  private readonly thisYearFormat = computed(
    () => new Intl.DateTimeFormat(this.languageStore.language(), thisYearOptions),
  );
  private readonly earlierYearFormat = computed(
    () => new Intl.DateTimeFormat(this.languageStore.language(), earlierYearOptions),
  );
  private readonly dateOfBirthFormat = computed(
    () => new Intl.DateTimeFormat(this.languageStore.language(), dateOfBirthOptions),
  );

  // A moment, such as when a post was written, shown in the visitor's own time zone.
  time(isoTime: string): string {
    return this.timeFormat().format(new Date(isoTime));
  }

  // A moment shown in a narrow place (a chat row, beside a message): the clock time when it is today, the
  // day and the month when it is this year, and the date with the year before that. "Today" is the
  // visitor's own day.
  shortTime(isoTime: string): string {
    const moment = new Date(isoTime);
    const now = new Date();
    const isToday = moment.toDateString() === now.toDateString();
    const isThisYear = moment.getFullYear() === now.getFullYear();

    let format = this.earlierYearFormat();
    if (isToday) {
      format = this.todayFormat();
    } else if (isThisYear) {
      format = this.thisYearFormat();
    }

    return format.format(moment);
  }

  dateOfBirth(isoDate: string): string {
    return this.dateOfBirthFormat().format(new Date(isoDate));
  }
}
