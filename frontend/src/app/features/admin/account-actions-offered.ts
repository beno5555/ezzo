import { AccountRowAction } from './account-row-action';
import { AccountState } from './account-state';
import { AdminUserDto } from './admin-user-dto';

// The actions a row offers, which are those the backend accepts for the account's state: it finds an
// active account to deactivate and to change the role of (the other reads hide the rest), a deactivated
// one to restore, and any account not yet deleted to delete. A deleted account waits for the cleanup job
// and offers none.
export function accountActionsOffered(account: AdminUserDto): AccountRowAction[] {
  const offered: AccountRowAction[] = [];

  if (account.state === AccountState.Active) {
    offered.push(AccountRowAction.Deactivate);
    offered.push(
      account.isAdministrator
        ? AccountRowAction.RemoveAdministrator
        : AccountRowAction.GrantAdministrator,
    );
  }
  if (account.state === AccountState.Deactivated) {
    offered.push(AccountRowAction.Restore);
  }
  if (account.state !== AccountState.SoftDeleted) {
    offered.push(AccountRowAction.Delete);
  }

  return offered;
}

// Editing a profile reads and writes through the reads that hide an account that is not active.
export function isAccountEditable(account: AdminUserDto): boolean {
  return account.state === AccountState.Active;
}
