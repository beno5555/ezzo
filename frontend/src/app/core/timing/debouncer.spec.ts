import type { Mock } from 'vitest';
import { Debouncer } from './debouncer';

describe('Debouncer', () => {
  const wait = 500;
  let action: Mock<() => void>;
  let debouncer: Debouncer;

  beforeEach(() => {
    vi.useFakeTimers();
    action = vi.fn<() => void>();
    debouncer = new Debouncer(action, wait);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs the action once the wait has passed since the call', () => {
    debouncer.call();

    vi.advanceTimersByTime(wait - 1);
    expect(action).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('starts the wait again on each call, so a pause just short of the wait changes nothing', () => {
    debouncer.call();
    vi.advanceTimersByTime(wait * 0.9);
    debouncer.call();
    vi.advanceTimersByTime(wait * 0.9);
    debouncer.call();
    vi.advanceTimersByTime(wait * 0.9);
    expect(action).not.toHaveBeenCalled();

    vi.advanceTimersByTime(wait * 0.1);
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('runs the action once for a series of calls, and again for a later call', () => {
    debouncer.call();
    debouncer.call();
    debouncer.call();
    vi.advanceTimersByTime(wait);
    expect(action).toHaveBeenCalledTimes(1);

    debouncer.call();
    vi.advanceTimersByTime(wait);
    expect(action).toHaveBeenCalledTimes(2);
  });

  it('runs nothing after cancel', () => {
    debouncer.call();
    debouncer.cancel();

    vi.advanceTimersByTime(wait * 2);
    expect(action).not.toHaveBeenCalled();
  });

  it('can be cancelled with nothing waiting', () => {
    expect(() => debouncer.cancel()).not.toThrow();
  });
});
