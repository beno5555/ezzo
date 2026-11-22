import { signal } from '@angular/core';

// How long an item takes to fade out once its deletion is confirmed. FadeOut's duration-200 is the same
// length: change both together.
export const deleteFadeMilliseconds = 200;

// The state of "fade out, then leave" that a post, a comment and a message share (owner, 2026-11-22). A store
// keeps one, and an item fades while isFading(id) holds (the FadeOut directive on its root draws that):
//   await this.deleteFade.fadeOut(id);          // fades, waits, then the item has left: isGone(id)
//   const result = await this.api.delete(id);   // the server answers after the item has already left
//   if (!result.succeeded) { this.deleteFade.bringBack(id); }
// A list leaves out what isGone says. Ids are never used again, so a gone item needs no cleaning up.
export class DeleteFade {
  private readonly fading = signal<ReadonlySet<number>>(new Set());
  private readonly gone = signal<ReadonlySet<number>>(new Set());

  readonly fadingIds = this.fading.asReadonly();
  readonly goneIds = this.gone.asReadonly();

  // True from the start of the fade until the item has left.
  isFading(id: number): boolean {
    return this.fading().has(id);
  }

  // True from the moment the item has faded out, until bringBack.
  isGone(id: number): boolean {
    return this.gone().has(id);
  }

  // True while a deletion of the item is under way, so a second one is not started.
  isBusy(id: number): boolean {
    return this.isFading(id) || this.isGone(id);
  }

  // Resolves once the item has faded out and left.
  async fadeOut(id: number): Promise<void> {
    this.fading.update((ids) => new Set(ids).add(id));
    await new Promise((resolve) => setTimeout(resolve, deleteFadeMilliseconds));
    this.gone.update((ids) => new Set(ids).add(id));
    this.fading.update((ids) => withoutId(ids, id));
  }

  // The server refused the deletion: the item shows again.
  bringBack(id: number): void {
    this.gone.update((ids) => withoutId(ids, id));
  }
}

function withoutId(ids: ReadonlySet<number>, id: number): ReadonlySet<number> {
  const rest = new Set(ids);
  rest.delete(id);

  return rest;
}
