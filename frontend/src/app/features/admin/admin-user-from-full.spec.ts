import { FullUserDto } from '../users/full-user-dto';
import { AccountState } from './account-state';
import { adminUserFromFull } from './admin-user-from-full';

const created: FullUserDto = {
  id: 12,
  username: 'new_user',
  email: 'new.user@example.com',
  bio: null,
  roles: ['User'],
  registeredAt: '2026-11-21T10:00:00Z',
  dateOfBirth: '2000-04-01T00:00:00Z',
  usernameLastChangedAt: null,
};

describe('adminUserFromFull', () => {
  it('shows a new account as an active user who was never deactivated or deleted', () => {
    expect(adminUserFromFull(created)).toEqual({
      id: 12,
      username: 'new_user',
      email: 'new.user@example.com',
      isAdministrator: false,
      state: AccountState.Active,
      registeredAt: '2026-11-21T10:00:00Z',
      deactivatedAt: null,
      deletedAt: null,
    });
  });

  it('shows an account that holds the administrator role as an administrator', () => {
    const administrator = adminUserFromFull({ ...created, roles: ['User', 'Administrator'] });

    expect(administrator.isAdministrator).toBe(true);
  });
});
