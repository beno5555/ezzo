import { AccountRowAction } from './account-row-action';
import { AccountState } from './account-state';
import { AdminUserDto } from './admin-user-dto';

// The row as it is once the server has done the action: what the screen shows at once, before the
// request goes (spec, "Quick actions show their result at once"). now is the moment the server will
// write, an ISO string, so a deactivation or a deletion shows its date.
export function accountAfterAction(
  account: AdminUserDto,
  action: AccountRowAction,
  now: string,
): AdminUserDto {
  let after: AdminUserDto;

  switch (action) {
    case AccountRowAction.Deactivate:
      after = { ...account, state: AccountState.Deactivated, deactivatedAt: now };
      break;
    case AccountRowAction.Restore:
      after = { ...account, state: AccountState.Active, deactivatedAt: null };
      break;
    case AccountRowAction.Delete:
      after = { ...account, state: AccountState.SoftDeleted, deletedAt: now };
      break;
    case AccountRowAction.GrantAdministrator:
      after = { ...account, isAdministrator: true };
      break;
    case AccountRowAction.RemoveAdministrator:
      after = { ...account, isAdministrator: false };
      break;
  }

  return after;
}
