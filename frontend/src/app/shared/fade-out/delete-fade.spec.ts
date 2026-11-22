import { DeleteFade, deleteFadeMilliseconds } from './delete-fade';

describe('DeleteFade', () => {
  let deleteFade: DeleteFade;

  beforeEach(() => {
    vi.useFakeTimers();
    deleteFade = new DeleteFade();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

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
