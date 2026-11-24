import { HttpStatusCode } from '@angular/common/http';
import { computed, signal } from '@angular/core';
import { LIMITS } from '../../core/limits';
import { PagedList } from '../../core/paging/paged-list';
import { AdminApi } from './admin-api';
import { LogDisplayDto } from './log-display-dto';
import { LogFilter } from './log-filter';

// The log rows the logs page shows for one filter: a paged list of the server's rows, newest first. A page
// makes a new table whenever the filter changes, so a table never mixes two filters. A filter the backend
// refuses (a period that ends before it starts, answered with 400) is not a failed page to try again, since
// the same filter would be refused again: the table keeps the server's sentence as its refusal, for the
// page to show beside the filter.
export class LogTable {
  private readonly list: PagedList<LogDisplayDto>;
  private readonly refusedWith = signal<string | null>(null);

  readonly rows = computed(() => this.list.items());
  readonly status = computed(() => this.list.status());
  // The text of a failed page that is a plain failure (the network, a signed-out session); null while the
  // last page arrived or was a refusal.
  readonly failureMessage = computed(() =>
    this.refusedWith() === null ? this.list.failureMessage() : null,
  );
  // The server's sentence about a filter it refused, null otherwise.
  readonly refusal = this.refusedWith.asReadonly();

  constructor(filter: LogFilter, adminApi: AdminApi) {
    this.list = new PagedList<LogDisplayDto>({
      loadPage: async (page) => {
        const result = await adminApi.getLogs({ ...page, ...filter });
        const isRefusal = !result.succeeded && result.status === HttpStatusCode.BadRequest;

        this.refusedWith.set(isRefusal ? result.message : null);

        return result;
      },
      pageSize: LIMITS.paging.defaultPageSize,
      keyOf: (row) => row.id,
    });
  }

  async loadNext(): Promise<void> {
    await this.list.loadNext();
  }
}
