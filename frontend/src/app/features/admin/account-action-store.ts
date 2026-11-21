import { Injectable, inject, signal } from '@angular/core';
import { AppResult } from '../../core/http/app-result';
import { ToastStore } from '../../shared/toasts/toast-store';
import { AccountActivationApi } from '../accounts/account-activation-api';
import { AccountManagementApi } from '../accounts/account-management-api';
import { accountAfterAction } from './account-after-action';
import { AccountRowAction } from './account-row-action';
import { AdminUserDto } from './admin-user-dto';

// Runs the administrator's row actions (the page has asked and been answered yes). The row shows its new
// state on the click, as if the server had agreed (owner, 2026-11-20); if the server refuses, the row is
// put back as it was and a toast says why. A click on a row whose request is on its way is ignored, so
// the server never gets two actions for one account at once. PostLikeStore is the pattern.
//   await this.accountActions.run(row, AccountRowAction.Deactivate, (shown) => table.replace(shown));
@Injectable({ providedIn: 'root' })
export class AccountActionStore {
  private readonly activationApi = inject(AccountActivationApi);
  private readonly managementApi = inject(AccountManagementApi);
  private readonly toastStore = inject(ToastStore);

  // The accounts whose action is on its way.
  private readonly pendingIds = signal<ReadonlySet<number>>(new Set());

  isBusy(accountId: number): boolean {
    return this.pendingIds().has(accountId);
  }

  // show puts a row in the page's table: first the account as the action leaves it, and again the account
  // as it was when the server refuses.
  async run(
    account: AdminUserDto,
    action: AccountRowAction,
    show: (account: AdminUserDto) => void,
  ): Promise<void> {
    const isIdle = !this.isBusy(account.id);

    if (isIdle) {
      this.setPending(account.id, true);
      show(accountAfterAction(account, action, new Date().toISOString()));
      const result = await this.send(account.id, action);
      this.setPending(account.id, false);

      if (!result.succeeded) {
        show(account);
        this.toastStore.show(result.message);
      }
    }
  }

  private send(accountId: number, action: AccountRowAction): Promise<AppResult<void>> {
    let sending: Promise<AppResult<void>>;

    switch (action) {
      case AccountRowAction.Deactivate:
        sending = this.activationApi.deactivateAccount(accountId);
        break;
      case AccountRowAction.Restore:
        sending = this.activationApi.reactivateAccount(accountId);
        break;
      case AccountRowAction.Delete:
        sending = this.managementApi.deleteAccount(accountId);
        break;
      case AccountRowAction.GrantAdministrator:
        sending = this.managementApi.assignAdministrator(accountId);
        break;
      case AccountRowAction.RemoveAdministrator:
        sending = this.managementApi.removeAdministrator(accountId);
        break;
    }

    return sending;
  }

  private setPending(accountId: number, isPending: boolean): void {
    this.pendingIds.update((ids) => {
      const next = new Set(ids);
      if (isPending) {
        next.add(accountId);
      } else {
        next.delete(accountId);
      }
      return next;
    });
  }
}
