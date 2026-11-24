import { usernameChangeOpensAt } from './username-change-opens-at';

describe('usernameChangeOpensAt', () => {
  it('is 20 days after the username was last changed', () => {
    expect(usernameChangeOpensAt('2026-11-01T08:15:00Z')).toBe('2026-11-21T08:15:00.000Z');
  });

  it('counts whole days across a month end', () => {
    expect(usernameChangeOpensAt('2026-11-20T10:00:00Z')).toBe('2026-12-10T10:00:00.000Z');
  });
});
