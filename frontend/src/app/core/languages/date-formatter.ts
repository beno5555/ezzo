import { Injectable, computed, inject } from '@angular/core';
import { MinuteClock, minuteInMilliseconds } from '../time/minute-clock';
import { LanguageStore } from './language-store';

const timeOptions: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' };

// The three forms of a short time (shortTime).
const todayOptions: Intl.DateTimeFormatOptions = { timeStyle: 'short' };
const thisYearOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
const earlierYearOptions: Intl.DateTimeFormatOptions = { dateStyle: 'medium' };

// How long ago (timeSince, shortTimeSince).
const hourInMilliseconds = 60 * minuteInMilliseconds;
const dayInMilliseconds = 24 * hourInMilliseconds;
const weekInMilliseconds = 7 * dayInMilliseconds;

// A date of birth is a calendar date sent as midnight UTC; read in UTC, so nobody west of UTC sees the day before.
const dateOfBirthOptions: Intl.DateTimeFormatOptions = { dateStyle: 'long', timeZone: 'UTC' };

// The one formatter for times and dates the backend sends (UTC ISO strings, ADR 0005), in the current
// language. A template that calls it redraws when the language changes, because it reads the store.
@Injectable({ providedIn: 'root' })
export class DateFormatter {
  private readonly languageStore = inject(LanguageStore);
  private readonly minuteClock = inject(MinuteClock);

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

  // How long ago a moment was, for "Active 5 minutes ago": "just now" under a minute, then minutes, hours
  // and days ("yesterday"), and the short date (shortTime) from a week back. It moves on with the clock.
  timeSince(isoTime: string): string {
    const elapsed = this.minuteClock.now() - Date.parse(isoTime);
    const texts = this.languageStore.text().shared.timeSince;
    const days = Math.floor(elapsed / dayInMilliseconds);

    let text = this.shortTime(isoTime);
    if (elapsed < minuteInMilliseconds) {
      text = texts.justNow;
    } else if (elapsed < hourInMilliseconds) {
      text = texts.minutesAgo(Math.floor(elapsed / minuteInMilliseconds));
    } else if (elapsed < dayInMilliseconds) {
      text = texts.hoursAgo(Math.floor(elapsed / hourInMilliseconds));
    } else if (days === 1) {
      text = texts.yesterday;
    } else if (elapsed < weekInMilliseconds) {
      text = texts.daysAgo(days);
    }

    return text;
  }

  // The same, as a count small enough for a badge: "12m", "3h" (Georgian "12წთ", "3სთ"); at least one
  // minute. Null from a day back, where a count of days would be too wide for a badge in Georgian.
  shortTimeSince(isoTime: string): string | null {
    const elapsed = this.minuteClock.now() - Date.parse(isoTime);
    const texts = this.languageStore.text().shared.timeSince;

    let text: string | null = null;
    if (elapsed < hourInMilliseconds) {
      text = texts.minutesShort(Math.max(1, Math.floor(elapsed / minuteInMilliseconds)));
    } else if (elapsed < dayInMilliseconds) {
      text = texts.hoursShort(Math.floor(elapsed / hourInMilliseconds));
    }

    return text;
  }

  dateOfBirth(isoDate: string): string {
    return this.dateOfBirthFormat().format(new Date(isoDate));
  }
}
