import { Injectable, computed, inject } from '@angular/core';
import { MinuteClock, minuteInMilliseconds } from '../time/minute-clock';
import { LanguageStore } from './language-store';

// The clock time. The dates around it are written from the dictionary (shared.dates), not by Intl:
// Chrome has no Georgian data for dates and would write them in English.
const clockOptions: Intl.DateTimeFormatOptions = { timeStyle: 'short' };

// How long ago (timeSince, shortTimeSince).
const hourInMilliseconds = 60 * minuteInMilliseconds;
const dayInMilliseconds = 24 * hourInMilliseconds;
const weekInMilliseconds = 7 * dayInMilliseconds;

// The one formatter for times and dates the backend sends (UTC ISO strings, ADR 0005), in the current
// language. A template that calls it redraws when the language changes, because it reads the store.
@Injectable({ providedIn: 'root' })
export class DateFormatter {
  private readonly languageStore = inject(LanguageStore);
  private readonly minuteClock = inject(MinuteClock);

  private readonly clockFormat = computed(
    () => new Intl.DateTimeFormat(this.languageStore.language(), clockOptions),
  );

  // A moment, such as when a post was written, shown in the visitor's own time zone:
  // "Nov 15, 2026, 6:30 PM".
  time(isoTime: string): string {
    const dates = this.languageStore.text().shared.dates;

    return dates.dateAndTime(this.dateWithYear(new Date(isoTime)), this.clockTime(isoTime));
  }

  // A moment shown in a narrow place (a chat row): the clock time when it is today, the day and the
  // month when it is this year, and the date with the year before that. "Today" is the visitor's own day.
  shortTime(isoTime: string): string {
    const moment = new Date(isoTime);
    const now = new Date();
    const isToday = moment.toDateString() === now.toDateString();
    const isThisYear = moment.getFullYear() === now.getFullYear();

    let text = this.dateWithYear(moment);
    if (isToday) {
      text = this.clockTime(isoTime);
    } else if (isThisYear) {
      text = this.dateWithoutYear(moment);
    }

    return text;
  }

  // Only the clock time, such as under a message: "3:38 PM".
  clockTime(isoTime: string): string {
    return this.clockFormat().format(new Date(isoTime));
  }

  // The day of a moment, without the year, such as above the first message of a day: "Today",
  // "Yesterday", "Nov 19". Today is the visitor's own day, and the text moves on at midnight.
  day(isoTime: string): string {
    const moment = new Date(isoTime);
    const now = new Date(this.minuteClock.now());
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const days = this.languageStore.text().shared.days;

    let text = this.dateWithoutYear(moment);
    if (moment.toDateString() === now.toDateString()) {
      text = days.today;
    } else if (moment.toDateString() === yesterday.toDateString()) {
      text = days.yesterday;
    }

    return text;
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

  // A date of birth: "March 1, 2000". It is a calendar date sent as midnight UTC, read in UTC, so nobody
  // west of UTC sees the day before.
  dateOfBirth(isoDate: string): string {
    const date = new Date(isoDate);
    const dates = this.languageStore.text().shared.dates;

    return dates.dayMonthYear(
      date.getUTCDate(),
      dates.monthsLong[date.getUTCMonth()],
      date.getUTCFullYear(),
    );
  }

  // "Nov 19" in the visitor's time zone.
  private dateWithoutYear(moment: Date): string {
    const dates = this.languageStore.text().shared.dates;

    return dates.dayMonth(moment.getDate(), dates.monthsShort[moment.getMonth()]);
  }

  // "Nov 19, 2025" in the visitor's time zone.
  private dateWithYear(moment: Date): string {
    const dates = this.languageStore.text().shared.dates;

    return dates.dayMonthYear(
      moment.getDate(),
      dates.monthsShort[moment.getMonth()],
      moment.getFullYear(),
    );
  }
}
