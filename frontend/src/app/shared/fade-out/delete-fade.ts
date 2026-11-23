import { signal } from '@angular/core';

// How long an item takes to fade out once its deletion has succeeded. FadeOut's duration-200 is the same
// length: change both together.
export const deleteFadeMilliseconds = 200;

// The shortest time the "Deleting…" notice stays on an item, so that a fast answer shows it for a moment
// instead of flickering. A slower server keeps it as long as the answer takes.
export const deleteNoticeMinimumMilliseconds = 400;

// The state of "Deleting…, then fade out, then leave" that a post, a comment, a message and a friend share
// (owner, 2026-11-23). A store keeps one; the item shows the notice while isWaiting(id) holds and fades
// while isFading(id) holds (the FadeOut directive on its root draws both):
//   const result = await this.deleteFade.delete(id, () => this.api.delete(id));
//   if (!result.succeeded) { …toast…; }   // a refusal leaves the item where it was
// A list leaves out what isGone says. Ids are never used again, so a gone item needs no cleaning up.
export class DeleteFade {
  private readonly waiting = signal<ReadonlySet<number>>(new Set());
  private readonly fading = signal<ReadonlySet<number>>(new Set());
  private readonly gone = signal<ReadonlySet<number>>(new Set());

  readonly waitingIds = this.waiting.asReadonly();
  readonly fadingIds = this.fading.asReadonly();
  readonly goneIds = this.gone.asReadonly();

  // True while the server has not answered, and for the notice's minimum time.
  isWaiting(id: number): boolean {
    return this.waiting().has(id);
  }

  // True from the server's yes until the item has left.
  isFading(id: number): boolean {
    return this.fading().has(id);
  }

  // True once the item has faded out: from then on, for good.
  isGone(id: number): boolean {
    return this.gone().has(id);
  }

  // True while a deletion of the item is under way or done, so a second one is not started.
  isBusy(id: number): boolean {
    return this.isWaiting(id) || this.isFading(id) || this.isGone(id);
  }

  // Sends the request and resolves with its answer. The item shows "Deleting…" until the answer has come
  // and the minimum time has passed. On a yes it then fades out and leaves before this resolves; on a no
  // it stays as it was.
  async delete<T extends { succeeded: boolean }>(
    id: number,
    request: () => Promise<T>,
  ): Promise<T> {
    this.waiting.update((ids) => new Set(ids).add(id));
    let result: T;

    try {
      [result] = await Promise.all([request(), pause(deleteNoticeMinimumMilliseconds)]);
    } finally {
      // Also when the request throws, so an item is never stuck on "Deleting…".
      this.waiting.update((ids) => withoutId(ids, id));
    }

    if (result.succeeded) {
      await this.fadeOut(id);
    }

    return result;
  }

  // Resolves once the item has faded out and left, with no waiting before: for a quick action whose item
  // leaves at once, before the server answers (the admin's settling of a report or an account). A refusal
  // is undone with bringBack.
  async fadeOut(id: number): Promise<void> {
    this.fading.update((ids) => new Set(ids).add(id));
    await pause(deleteFadeMilliseconds);
    this.gone.update((ids) => new Set(ids).add(id));
    this.fading.update((ids) => withoutId(ids, id));
  }

  // The server refused what fadeOut started: the item shows again.
  bringBack(id: number): void {
    this.gone.update((ids) => withoutId(ids, id));
  }
}

function pause(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function withoutId(ids: ReadonlySet<number>, id: number): ReadonlySet<number> {
  const rest = new Set(ids);
  rest.delete(id);

  return rest;
}
