import { signal } from '@angular/core';
import { LIMITS } from '../limits';
import { PageLoadStatus } from './page-load-status';
import { PagedListOptions } from './paged-list-options';

// A list read from the backend one page at a time, the pattern every paged list copies (the feed first).
// loadNext appends the next page; a page shorter than the page size is the last. While a page is loading,
// or after the last one, loadNext asks for nothing, so the same page is never loaded twice at once. A
// failed page keeps what is shown, and the next call asks for that page again. A page component makes one
// with `new PagedList(...)`, so the list lives and dies with the page.
export class PagedList<T> {
  private readonly options: PagedListOptions<T>;
  private readonly loaded = signal<readonly T[]>([]);
  private readonly currentStatus = signal<PageLoadStatus>(PageLoadStatus.Idle);
  private readonly lastFailure = signal<string | null>(null);
  // Where in the server's list the first item not yet seen is: the pages loaded cover everything before it.
  // It grows a page at a time, and shrinks by one when a loaded item leaves the server's list (see leave).
  private unseenOffset = 0;

  readonly items = this.loaded.asReadonly();
  readonly status = this.currentStatus.asReadonly();
  // The text of the last failed page, null once a page arrives.
  readonly failureMessage = this.lastFailure.asReadonly();

  constructor(options: PagedListOptions<T>) {
    this.options = options;
  }

  async loadNext(): Promise<void> {
    const canLoad =
      this.currentStatus() === PageLoadStatus.Idle ||
      this.currentStatus() === PageLoadStatus.Failed;

    if (canLoad) {
      this.currentStatus.set(PageLoadStatus.Loading);
      const pageNumber = this.pageToAsk();
      const result = await this.options.loadPage({
        pageNumber,
        pageSize: this.options.pageSize,
      });

      if (result.succeeded) {
        this.loaded.update((items) => this.withNew(items, result.data));
        this.unseenOffset =
          (pageNumber - LIMITS.paging.firstPageNumber + 1) * this.options.pageSize;
        this.lastFailure.set(null);
        const isLastPage = result.data.length < this.options.pageSize;
        this.currentStatus.set(isLastPage ? PageLoadStatus.Ended : PageLoadStatus.Idle);
      } else {
        // The page number stays, so the next call asks for this page again.
        this.lastFailure.set(result.message);
        this.currentStatus.set(PageLoadStatus.Failed);
      }
    }
  }

  // Puts an item the page changed (a like, an edit) in place of the loaded one with the same key.
  replace(changed: T): void {
    const changedKey = this.options.keyOf(changed);
    this.loaded.update((items) =>
      items.map((item) => (this.options.keyOf(item) === changedKey ? changed : item)),
    );
  }

  // Takes an item out, such as a deleted comment.
  remove(removedKey: number | string): void {
    this.loaded.update((items) => items.filter((item) => this.options.keyOf(item) !== removedKey));
  }

  // Takes out an item that has left the server's own list, such as a flagged post an administrator has
  // settled. Every later item moves up by one on the server, so a page asked for by its number would skip
  // the items that moved into the pages already loaded: loadNext asks for the page that holds the first
  // item not yet seen instead, and the repeats that page brings are dropped.
  leave(leavingKey: number | string): void {
    const isLoaded = this.loaded().some((item) => this.options.keyOf(item) === leavingKey);

    if (isLoaded) {
      this.unseenOffset -= 1;
      this.remove(leavingKey);
    }
  }

  // Puts an item the user just made (the server's copy of a new post or a new comment) on top. It shows once: a page that
  // already brought it keeps it where it is, and a later page that holds it does not show it again.
  prepend(added: T): void {
    const addedKey = this.options.keyOf(added);
    this.loaded.update((items) => {
      const isShown = items.some((item) => this.options.keyOf(item) === addedKey);

      return isShown ? items : [added, ...items];
    });
  }

  // The page that holds the first item not yet seen: the page after the last one loaded, until an item leaves.
  private pageToAsk(): number {
    return LIMITS.paging.firstPageNumber + Math.floor(this.unseenOffset / this.options.pageSize);
  }

  // A ranked list can move an item onto the next page between two loads, so a page may repeat one.
  private withNew(items: readonly T[], page: readonly T[]): readonly T[] {
    const loadedKeys = new Set(items.map((item) => this.options.keyOf(item)));
    const fresh = page.filter((item) => !loadedKeys.has(this.options.keyOf(item)));
    return [...items, ...fresh];
  }
}
