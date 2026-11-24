import { joinDateTime, splitDateTime } from './date-time-parts';

describe('splitDateTime', () => {
  it('splits a value into the date, the clock, the year and the month (0 for January)', () => {
    expect(splitDateTime('2026-11-20T14:30')).toEqual({
      date: '2026-11-20',
      time: '14:30',
      year: 2026,
      month: 10,
    });
  });

  it('gives null for an empty value, a missing one and one that is not a date and a clock', () => {
    expect(splitDateTime('')).toBeNull();
    expect(splitDateTime(null)).toBeNull();
    expect(splitDateTime('2026-11-20')).toBeNull();
    expect(splitDateTime('2026-11-20T14:30:15')).toBeNull();
  });
});

describe('joinDateTime', () => {
  it('writes a date and a clock as one value', () => {
    expect(joinDateTime('2026-11-20', '09:05')).toBe('2026-11-20T09:05');
  });

  it('is empty while no date is picked', () => {
    expect(joinDateTime(undefined, '09:05')).toBe('');
  });
});
