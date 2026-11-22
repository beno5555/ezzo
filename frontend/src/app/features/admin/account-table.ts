import { computed, signal } from '@angular/core';
import { PageQuery } from '../../core/http/page-query';
import { LIMITS } from '../../core/limits';
import { PagedList } from '../../core/paging/paged-list';
import { AccountListQuery } from './account-list-query';
import { AccountFilter } from './account-filter';
import { AdminApi } from './admin-api';
import { AdminUserDto } from './admin-user-dto';

// The accounts the users page shows for one filter: a paged list of the server's rows, and the rows the
// administrator created meanwhile, shown after them (the list is oldest first, so a new account belongs
// at the end, and a later page that brings it takes it over without showing it twice). A page makes a
// new table whenever the filter changes, so a table never mixes two filters.
export class AccountTable {
  private readonly list: PagedList<AdminUserDto>;
  private readonly created = signal<readonly AdminUserDto[]>([]);

  // The rows in the order shown.
  readonly rows = computed(() => {
    const loaded = this.list.items();
    const loadedIds = new Set(loaded.map((account) => account.id));
    const notLoaded = this.created().filter((account) => !loadedIds.has(account.id));

    return [...loaded, ...notLoaded];
  });
  readonly status = computed(() => this.list.status());
  readonly failureMessage = computed(() => this.list.failureMessage());

  constructor(
    private readonly filter: AccountFilter,
    adminApi: AdminApi,
  ) {
    this.list = new PagedList<AdminUserDto>({
      loadPage: (page) => adminApi.getUsers(toQuery(page, filter)),
      pageSize: LIMITS.paging.defaultPageSize,
      keyOf: (account) => account.id,
    });
  }

  async loadNext(): Promise<void> {
    await this.list.loadNext();
  }

  // Puts an account the administrator changed (a new state, a new name) in place of its row.
  replace(changed: AdminUserDto): void {
    this.list.replace(changed);
    this.created.update((rows) =>
      rows.map((account) => (account.id === changed.id ? changed : account)),
    );
  }

  // Shows an account the administrator just created, when the filter would have listed it.
  add(account: AdminUserDto): void {
    const isListed = this.matchesFilter(account);
    const isShown = this.rows().some((shown) => shown.id === account.id);

    if (isListed && !isShown) {
      this.created.update((rows) => [...rows, account]);
    }
  }

  private matchesFilter(account: AdminUserDto): boolean {
    const matchesState = this.filter.state === undefined || this.filter.state === account.state;
    const typed = (this.filter.username ?? '').trim().toLowerCase();
    const matchesUsername = account.username.toLowerCase().includes(typed);

    return matchesState && matchesUsername;
  }
}

function toQuery(page: PageQuery, filter: AccountFilter): AccountListQuery {
  return { ...page, ...filter };
}
