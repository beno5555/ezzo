import { accountAfterAction } from './account-after-action';
import { AccountRowAction } from './account-row-action';
import { AccountState } from './account-state';
import { AdminUserDto } from './admin-user-dto';

const now = '2026-11-21T12:00:00Z';
const active: AdminUserDto = {
  id: 4,
  username: 'john_doe',
  email: 'john@example.com',
  isAdministrator: false,
  state: AccountState.Active,
  registeredAt: '2026-01-05T10:00:00Z',
  deactivatedAt: null,
  deletedAt: null,
};

describe('accountAfterAction', () => {
  it('shows a deactivated account with the moment of the deactivation', () => {
    expect(accountAfterAction(active, AccountRowAction.Deactivate, now)).toEqual({
      ...active,
      state: AccountState.Deactivated,
      deactivatedAt: now,
    });
  });

  it('shows a restored account active, with no deactivation date', () => {
    const deactivated = {
      ...active,
      state: AccountState.Deactivated,
      deactivatedAt: '2026-02-01T08:30:00Z',
    };

    expect(accountAfterAction(deactivated, AccountRowAction.Restore, now)).toEqual(active);
  });

  it('shows a deleted account with the moment of the deletion, and keeps an earlier deactivation', () => {
    const deactivated = {
      ...active,
      state: AccountState.Deactivated,
      deactivatedAt: '2026-02-01T08:30:00Z',
    };

    expect(accountAfterAction(deactivated, AccountRowAction.Delete, now)).toEqual({
      ...deactivated,
      state: AccountState.SoftDeleted,
      deletedAt: now,
    });
  });

  it('shows the administrator role granted and removed', () => {
    const granted = accountAfterAction(active, AccountRowAction.GrantAdministrator, now);
    const removed = accountAfterAction(granted, AccountRowAction.RemoveAdministrator, now);

    expect(granted.isAdministrator).toBe(true);
    expect(removed).toEqual(active);
  });

  it('leaves the account it was given unchanged', () => {
    accountAfterAction(active, AccountRowAction.Delete, now);

    expect(active.state).toBe(AccountState.Active);
    expect(active.deletedAt).toBeNull();
  });
});
