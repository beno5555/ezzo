import { computed } from '@angular/core';
import { AppResult } from '../../core/http/app-result';
import { PageLoadStatus } from '../../core/paging/page-load-status';
import { PagedList } from '../../core/paging/paged-list';
import { PagedListOptions } from '../../core/paging/paged-list-options';
import { DeleteFade } from '../../shared/fade-out/delete-fade';

// A paged list of items an administrator settles one by one, a report or a flagged post: a settled item
// leaves the list (the reports list shows one status, the queue one status too), so the list is only what
// is still open. Like the other quick actions (owner, 2026-11-20), the item fades out and leaves on the
// click, then the request goes; when the server refuses, the item comes back and the refusal's message
// goes to the page, which shows a toast. A page makes one per filter, so a list never mixes two filters.
//   const failure = await list.settle(report, () => api.decide(report.id, decision), others);
export class SettlingList<T extends { id: number }> {
  private readonly list: PagedList<T>;
  private readonly fade = new DeleteFade();

  // The items still open, in the order the server sent them.
  readonly rows = computed(() => this.list.items().filter((item) => !this.fade.isGone(item.id)));
  readonly status = computed(() => this.list.status());
  readonly failureMessage = computed(() => this.list.failureMessage());

  // The items are told apart by their id.
  constructor(options: Omit<PagedListOptions<T>, 'keyOf'>) {
    this.list = new PagedList<T>({ ...options, keyOf: (item) => item.id });
  }

  async loadNext(): Promise<void> {
    await this.list.loadNext();
  }

  // True while the item fades, for its FadeOut directive.
  isFading(id: number): boolean {
    return this.fade.isFading(id);
  }

  // Settles an item: send makes the request. alsoLeaving are the items the server settles with it (the other
  // pending reports on a hidden target); they leave once the server has agreed. Resolves with the
  // refusal's message, or null when the server agreed, or when the item's settling is already on its way
  // and this click is ignored.
  async settle(
    item: T,
    send: () => Promise<AppResult<void>>,
    alsoLeaving: readonly T[] = [],
  ): Promise<string | null> {
    let failure: string | null = null;
    const isIdle = !this.fade.isBusy(item.id);

    if (isIdle) {
      await this.fade.fadeOut(item.id);
      const result = await send();

      if (result.succeeded) {
        await Promise.all(alsoLeaving.map((other) => this.fade.fadeOut(other.id)));
        this.list.leave(item.id);
        for (const other of alsoLeaving) {
          this.list.leave(other.id);
        }
        // A page that was all settled shows nothing to scroll to, so the next page is asked for here.
        const isEmptyWithMore = this.rows().length === 0 && this.status() === PageLoadStatus.Idle;
        if (isEmptyWithMore) {
          await this.list.loadNext();
        }
      } else {
        this.fade.bringBack(item.id);
        failure = result.message;
      }
    }

    return failure;
  }
}
