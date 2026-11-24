import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LIMITS } from '../../core/limits';
import { beforeDeadline } from '../../core/time/before-deadline';
import { messageEditDeadline } from './message-edit-deadline';

describe('messageEditDeadline', () => {
  const sentAt = '2026-11-23T10:00:00Z';
  const sentAtMilliseconds = Date.parse(sentAt);
  const minute = 60_000;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is 20 minutes after the message was sent', () => {
    expect(LIMITS.messages.editWindowMilliseconds).toBe(20 * minute);
    expect(messageEditDeadline({ sentAt })).toBe(sentAtMilliseconds + 20 * minute);
  });

  describe('as the message item uses it, with beforeDeadline', () => {
    function offerOf(message: { sentAt: string }) {
      const offered = TestBed.runInInjectionContext(() =>
        beforeDeadline(() => messageEditDeadline(message)),
      );
      TestBed.tick();

      return offered;
    }

    it('offers Edit for 19 minutes after sending', () => {
      vi.setSystemTime(sentAtMilliseconds + 19 * minute);

      expect(offerOf({ sentAt })()).toBe(true);
    });

    it('does not offer Edit once 20 minutes have passed', () => {
      vi.setSystemTime(sentAtMilliseconds + 20 * minute);

      expect(offerOf({ sentAt })()).toBe(false);
    });

    it('withdraws the offer at the moment the window closes while the conversation stays open', () => {
      vi.setSystemTime(sentAtMilliseconds + 5 * minute);
      const isOffered = offerOf({ sentAt });
      expect(isOffered()).toBe(true);

      vi.advanceTimersByTime(15 * minute - 1);
      expect(isOffered()).toBe(true);

      vi.advanceTimersByTime(1);
      expect(isOffered()).toBe(false);
    });

    it('follows the message when its time changes', () => {
      vi.setSystemTime(sentAtMilliseconds + 19 * minute);
      const message = signal({ sentAt });
      const isOffered = TestBed.runInInjectionContext(() =>
        beforeDeadline(() => messageEditDeadline(message())),
      );
      TestBed.tick();

      message.set({ sentAt: new Date(sentAtMilliseconds + 10 * minute).toISOString() });
      TestBed.tick();
      vi.advanceTimersByTime(minute);

      expect(isOffered()).toBe(true);
    });
  });
});
