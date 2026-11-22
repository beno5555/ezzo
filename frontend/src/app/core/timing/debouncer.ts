// How long a user must stop typing before a search that follows the typing runs (the spec's 300 ms for
// /search; the admin users page uses the same). Short enough to feel live, long enough that a request is
// not sent for every pause between two words.
export const typingPauseMilliseconds = 300;

// Runs an action once things have gone quiet: every call restarts the wait, so a series of calls less
// than the wait apart runs the action once, after the last of them. A search box calls it on each key and
// searches when the user stops typing:
//   private readonly typingPause = new Debouncer(() => void this.search(), typingPauseMilliseconds);
// cancel stops a run that is waiting, such as when the user searches at once by pressing Enter, or the
// page closes. A page cancels in its destroy hook, so no search starts after it has gone.
export class Debouncer {
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly action: () => void,
    private readonly waitMilliseconds: number,
  ) {}

  call(): void {
    this.cancel();
    this.timer = setTimeout(() => {
      this.timer = null;
      this.action();
    }, this.waitMilliseconds);
  }

  cancel(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
