import { accountActionsOffered, isAccountEditable } from './account-actions-offered';
import { AccountRowAction } from './account-row-action';
import { AccountState } from './account-state';
import { AdminUserDto } from './admin-user-dto';

const account = (overrides: Partial<AdminUserDto>): AdminUserDto => ({
  id: 4,
  username: 'john_doe',
  email: 'john@example.com',
  isAdministrator: false,
  state: AccountState.Active,
  registeredAt: '2026-01-05T10:00:00Z',
  deactivatedAt: null,
  deletedAt: null,
  ...overrides,
});

describe('accountActionsOffered', () => {
  it('offers an active user to be deactivated, deleted and made an administrator', () => {
    expect(accountActionsOffered(account({}))).toEqual([
      AccountRowAction.Deactivate,
      AccountRowAction.GrantAdministrator,
      AccountRowAction.Delete,
    ]);
  });

  it('offers an active administrator to have the role removed, not granted', () => {
    expect(accountActionsOffered(account({ isAdministrator: true }))).toEqual([
      AccountRowAction.Deactivate,
      AccountRowAction.RemoveAdministrator,
      AccountRowAction.Delete,
    ]);
  });

  it('offers a deactivated account to be restored and deleted, not deactivated again', () => {
    expect(accountActionsOffered(account({ state: AccountState.Deactivated }))).toEqual([
      AccountRowAction.Restore,
      AccountRowAction.Delete,
    ]);
  });

  it('offers nothing for a deleted account', () => {
    expect(accountActionsOffered(account({ state: AccountState.SoftDeleted }))).toEqual([]);
  });
});

describe('isAccountEditable', () => {
  it.each([
    [AccountState.Active, true],
    [AccountState.Deactivated, false],
    [AccountState.SoftDeleted, false],
  ])('is %s -> %s', (state, expected) => {
    expect(isAccountEditable(account({ state }))).toBe(expected);
  });
});
