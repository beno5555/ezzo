import { localInputToUtc, utcToLocalInput } from './local-date-time-input';

describe('local date-time input', () => {
  // The test run keeps whatever time zone the machine has, so each expectation is built from a moment
  // written in that zone and compared with its UTC form, not with a fixed offset.
  it('turns a time typed in the local zone into the UTC moment', () => {
    const expected = new Date(2026, 10, 20, 14, 30).toISOString();

    expect(localInputToUtc('2026-11-20T14:30')).toBe(expected);
  });

  it('ends a period at the last millisecond of its minute', () => {
    const expected = new Date(2026, 10, 20, 14, 30, 59, 999).toISOString();

    expect(localInputToUtc('2026-11-20T14:30', true)).toBe(expected);
  });

  it('leaves an empty or unreadable box as nothing', () => {
    expect(localInputToUtc('')).toBeUndefined();
    expect(localInputToUtc('soon')).toBeUndefined();
  });

  it('shows a UTC moment in the local zone, to the minute', () => {
    const moment = new Date(2026, 0, 5, 7, 4, 45);

    expect(utcToLocalInput(moment.toISOString())).toBe('2026-01-05T07:04');
  });

  it('gives the same box text back after a trip through UTC, for the end of a period too', () => {
    const utc = localInputToUtc('2026-11-20T23:59', true);

    expect(utcToLocalInput(utc)).toBe('2026-11-20T23:59');
  });

  it('shows nothing for a missing or unreadable moment', () => {
    expect(utcToLocalInput(undefined)).toBe('');
    expect(utcToLocalInput('soon')).toBe('');
  });
});
