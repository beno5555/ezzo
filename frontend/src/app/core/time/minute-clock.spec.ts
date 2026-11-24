import { TestBed } from '@angular/core/testing';
import { MinuteClock, minuteInMilliseconds } from './minute-clock';

describe('MinuteClock', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('moves on once a minute', () => {
    vi.useFakeTimers({ now: new Date('2026-11-22T10:00:00Z') });
    const clock = TestBed.inject(MinuteClock);

    vi.advanceTimersByTime(minuteInMilliseconds - 1);
    const beforeTheMinute = clock.now();
    vi.advanceTimersByTime(1);

    expect(beforeTheMinute).toBe(Date.parse('2026-11-22T10:00:00Z'));
    expect(clock.now()).toBe(Date.parse('2026-11-22T10:01:00Z'));
  });
});
