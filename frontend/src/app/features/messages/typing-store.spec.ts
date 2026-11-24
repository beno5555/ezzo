import { TypingStore, typingHideMilliseconds } from './typing-store';

describe('TypingStore', () => {
  let typingStore: TypingStore;

  beforeEach(() => {
    vi.useFakeTimers();
    typingStore = new TypingStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a friend as typing on their event, and hides them after 3 seconds of silence', () => {
    typingStore.userTyping({ userId: 3 });

    expect(typingStore.isTyping(3)).toBe(true);
    vi.advanceTimersByTime(typingHideMilliseconds - 1);
    expect(typingStore.isTyping(3)).toBe(true);
    vi.advanceTimersByTime(1);
    expect(typingStore.isTyping(3)).toBe(false);
  });

  it('counts the 3 seconds from the last event', () => {
    typingStore.userTyping({ userId: 3 });
    vi.advanceTimersByTime(2_000);
    typingStore.userTyping({ userId: 3 });
    vi.advanceTimersByTime(2_999);

    expect(typingStore.isTyping(3)).toBe(true);
    vi.advanceTimersByTime(1);
    expect(typingStore.isTyping(3)).toBe(false);
  });

  it('hides a friend when their message arrives, and shows no one else as typing', () => {
    typingStore.userTyping({ userId: 3 });
    typingStore.userTyping({ userId: 4 });

    typingStore.stop(3);

    expect(typingStore.isTyping(3)).toBe(false);
    expect(typingStore.isTyping(4)).toBe(true);
    expect(typingStore.isTyping(5)).toBe(false);
  });

  it('does not hide a friend who types again after being stopped, at the old moment', () => {
    typingStore.userTyping({ userId: 3 });
    vi.advanceTimersByTime(1_000);
    typingStore.stop(3);
    typingStore.userTyping({ userId: 3 });
    vi.advanceTimersByTime(typingHideMilliseconds - 1);

    expect(typingStore.isTyping(3)).toBe(true);
  });

  it('forgets everyone when cleared', () => {
    typingStore.userTyping({ userId: 3 });

    typingStore.clear();

    expect(typingStore.isTyping(3)).toBe(false);
  });
});
