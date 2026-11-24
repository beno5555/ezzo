import { toDateInputValue } from './to-date-input-value';

describe('toDateInputValue', () => {
  it('keeps the calendar date of a date of birth sent as midnight UTC', () => {
    expect(toDateInputValue('2000-04-01T00:00:00Z')).toBe('2000-04-01');
  });

  it('keeps a date that already has no time', () => {
    expect(toDateInputValue('2000-04-01')).toBe('2000-04-01');
  });
});
