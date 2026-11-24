import type { Options } from 'vanilla-calendar-pro';

// The calendar's number for a month: 0 for January to 11 for December.
type CalendarMonth = NonNullable<Options['selectedMonth']>;

// A picked moment, written the way a datetime-local box writes it: "2026-11-20T14:30", the wall-clock time
// of the visitor's own time zone, to the minute (core/time/local-date-time-input.ts turns it into UTC).

// The parts of a value, in the shapes the calendar takes: its date as "2026-11-20" and its clock as
// "14:30", and the year and month (0 for January) it opens on.
export interface DateTimeParts {
  date: string;
  time: string;
  year: number;
  month: CalendarMonth;
}

const valuePattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})$/;

// The parts of a value; null for an empty or unreadable one.
export function splitDateTime(value: string | null): DateTimeParts | null {
  const match = valuePattern.exec(value ?? '');

  return match === null
    ? null
    : {
        date: `${match[1]}-${match[2]}-${match[3]}`,
        time: match[4],
        year: Number(match[1]),
        month: (Number(match[2]) - 1) as CalendarMonth,
      };
}

// The value of a date and a clock the calendar holds; empty while no date is picked.
export function joinDateTime(date: string | undefined, time: string): string {
  return date === undefined ? '' : `${date}T${time}`;
}
