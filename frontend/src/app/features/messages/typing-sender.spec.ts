import { TestBed } from '@angular/core/testing';
import { HubClient } from '../../core/hub/hub-client';
import { TypingSender, typingSignalIntervalMilliseconds } from './typing-sender';

describe('TypingSender', () => {
  let typingSender: TypingSender;
  let sendTyping: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    sendTyping = vi.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [{ provide: HubClient, useValue: { sendTyping } }],
    });
    typingSender = TestBed.inject(TypingSender);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends the first keystroke at once', () => {
    typingSender.typed(3);

    expect(sendTyping).toHaveBeenCalledExactlyOnceWith(3);
  });

  it('sends at most once every 2 seconds however many keys are pressed', () => {
    typingSender.typed(3);
    for (let key = 0; key < 20; key++) {
      vi.advanceTimersByTime(100);
      typingSender.typed(3);
    }

    // 2.0 seconds have passed by the last key: the first send, and one more at exactly 2 seconds.
    expect(sendTyping).toHaveBeenCalledTimes(2);
  });

  it('holds back a keystroke 1999 ms after a send and lets one through at 2000 ms', () => {
    typingSender.typed(3);

    vi.advanceTimersByTime(typingSignalIntervalMilliseconds - 1);
    typingSender.typed(3);
    expect(sendTyping).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    typingSender.typed(3);
    expect(sendTyping).toHaveBeenCalledTimes(2);
  });

  it('keeps a count for each friend', () => {
    typingSender.typed(3);
    typingSender.typed(4);
    typingSender.typed(3);

    expect(sendTyping.mock.calls).toEqual([[3], [4]]);
  });
});
