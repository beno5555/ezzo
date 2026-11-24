import { DeleteFade, deleteFadeMilliseconds, deleteNoticeMinimumMilliseconds } from './delete-fade';

describe('DeleteFade', () => {
  let deleteFade: DeleteFade;

  // A request the test settles by hand, to stand for a server of any speed.
  function slowRequest(): {
    request: () => Promise<{ succeeded: boolean }>;
    settle: (ok: boolean) => void;
  } {
    let settle: (ok: boolean) => void = () => undefined;
    const answer = new Promise<{ succeeded: boolean }>((resolve) => {
      settle = (ok) => resolve({ succeeded: ok });
    });

    return { request: () => answer, settle };
  }

  beforeEach(() => {
    vi.useFakeTimers();
    deleteFade = new DeleteFade();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('fadeOut, for a quick action whose item leaves before the server answers', () => {
    it('fades the item for 200 ms, and then it has left', async () => {
      const fading = deleteFade.fadeOut(5);

      expect(deleteFade.isFading(5)).toBe(true);
      expect(deleteFade.isGone(5)).toBe(false);
      expect(deleteFade.isBusy(5)).toBe(true);

      await vi.advanceTimersByTimeAsync(deleteFadeMilliseconds - 1);
      expect(deleteFade.isFading(5)).toBe(true);

      await vi.advanceTimersByTimeAsync(1);
      await fading;
      expect(deleteFade.isFading(5)).toBe(false);
      expect(deleteFade.isGone(5)).toBe(true);
      expect(deleteFade.isBusy(5)).toBe(true);
    });

    it('leaves the other items alone', async () => {
      const fading = deleteFade.fadeOut(5);

      expect(deleteFade.isBusy(6)).toBe(false);
      await vi.advanceTimersByTimeAsync(deleteFadeMilliseconds);
      await fading;
      expect(deleteFade.isGone(6)).toBe(false);
    });

    it('shows the item again when it is brought back', async () => {
      const fading = deleteFade.fadeOut(5);
      await vi.advanceTimersByTimeAsync(deleteFadeMilliseconds);
      await fading;

      deleteFade.bringBack(5);

      expect(deleteFade.isGone(5)).toBe(false);
      expect(deleteFade.isBusy(5)).toBe(false);
    });
  });

  it('shows the notice for the minimum time when the server answers at once, then fades and leaves', async () => {
    const deleting = deleteFade.delete(5, () => Promise.resolve({ succeeded: true }));

    expect(deleteFade.isWaiting(5)).toBe(true);
    expect(deleteFade.isBusy(5)).toBe(true);

    await vi.advanceTimersByTimeAsync(deleteNoticeMinimumMilliseconds - 1);
    expect(deleteFade.isWaiting(5)).toBe(true);
    expect(deleteFade.isFading(5)).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(deleteFade.isWaiting(5)).toBe(false);
    expect(deleteFade.isFading(5)).toBe(true);
    expect(deleteFade.isGone(5)).toBe(false);

    await vi.advanceTimersByTimeAsync(deleteFadeMilliseconds);
    const result = await deleting;
    expect(deleteFade.isFading(5)).toBe(false);
    expect(deleteFade.isGone(5)).toBe(true);
    expect(deleteFade.isBusy(5)).toBe(true);
    expect(result.succeeded).toBe(true);
  });

  it('waits for a slow server, however long, before it fades', async () => {
    const { request, settle } = slowRequest();
    const deleting = deleteFade.delete(5, request);

    await vi.advanceTimersByTimeAsync(deleteNoticeMinimumMilliseconds * 10);
    expect(deleteFade.isWaiting(5)).toBe(true);
    expect(deleteFade.isFading(5)).toBe(false);

    settle(true);
    await vi.advanceTimersByTimeAsync(0);
    expect(deleteFade.isWaiting(5)).toBe(false);
    expect(deleteFade.isFading(5)).toBe(true);

    await vi.advanceTimersByTimeAsync(deleteFadeMilliseconds);
    await deleting;
    expect(deleteFade.isGone(5)).toBe(true);
  });

  it('leaves the item as it was when the server refuses', async () => {
    const deleting = deleteFade.delete(5, () => Promise.resolve({ succeeded: false }));

    await vi.advanceTimersByTimeAsync(deleteNoticeMinimumMilliseconds);
    const result = await deleting;

    expect(result.succeeded).toBe(false);
    expect(deleteFade.isWaiting(5)).toBe(false);
    expect(deleteFade.isFading(5)).toBe(false);
    expect(deleteFade.isGone(5)).toBe(false);
    expect(deleteFade.isBusy(5)).toBe(false);
  });

  it('drops the notice when the request throws, so the item is never stuck', async () => {
    const deleting = deleteFade.delete(5, () => Promise.reject(new Error('offline')));
    const outcome = expect(deleting).rejects.toThrow('offline');

    await vi.advanceTimersByTimeAsync(deleteNoticeMinimumMilliseconds);
    await outcome;
    expect(deleteFade.isBusy(5)).toBe(false);
  });

  it('leaves the other items alone', async () => {
    const deleting = deleteFade.delete(5, () => Promise.resolve({ succeeded: true }));

    expect(deleteFade.isBusy(6)).toBe(false);
    await vi.advanceTimersByTimeAsync(deleteNoticeMinimumMilliseconds + deleteFadeMilliseconds);
    await deleting;
    expect(deleteFade.isGone(6)).toBe(false);
  });
});
