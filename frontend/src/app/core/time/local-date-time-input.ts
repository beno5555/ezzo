// The value of a `datetime-local` input is a wall-clock time in the visitor's own time zone, to the minute:
// "2026-11-20T14:30". The backend takes and sends UTC (ADR 0005), so a period typed in a box is turned into
// UTC on its way out, and a UTC time from the address is turned back into the box's local time.

const lastMillisecondOfAMinute = 59_999;

// The UTC moment, as an ISO string, of a time typed in a datetime-local box; undefined for an empty or
// unreadable box. The end of a period passes `isEndOfMinute`: a period "to 14:30" holds the whole minute,
// since the box cannot say seconds and the backend's end is inclusive.
export function localInputToUtc(value: string, isEndOfMinute = false): string | undefined {
  const moment = new Date(value);
  const isReadable = value !== '' && !Number.isNaN(moment.getTime());

  return isReadable
    ? new Date(moment.getTime() + (isEndOfMinute ? lastMillisecondOfAMinute : 0)).toISOString()
    : undefined;
}

// The text for a datetime-local box that shows a UTC moment in the visitor's own time zone, to the minute;
// an empty string when the moment is missing or unreadable.
export function utcToLocalInput(isoTime: string | undefined): string {
  const moment = new Date(isoTime ?? '');
  const isReadable = !Number.isNaN(moment.getTime());

  return isReadable
    ? `${moment.getFullYear()}-${twoDigits(moment.getMonth() + 1)}-${twoDigits(moment.getDate())}` +
        `T${twoDigits(moment.getHours())}:${twoDigits(moment.getMinutes())}`
    : '';
}

function twoDigits(value: number): string {
  return String(value).padStart(2, '0');
}
