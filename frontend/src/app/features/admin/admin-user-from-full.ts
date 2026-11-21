import { RoleName } from '../../core/session/role-name';
import { FullUserDto } from '../users/full-user-dto';
import { AccountState } from './account-state';
import { AdminUserDto } from './admin-user-dto';

// The row of an account an administrator just created, from the full shape the backend answers with. A
// new account is active, and was never deactivated or deleted.
export function adminUserFromFull(user: FullUserDto): AdminUserDto {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    isAdministrator: user.roles.includes(RoleName.Administrator),
    state: AccountState.Active,
    registeredAt: user.registeredAt,
    deactivatedAt: null,
    deletedAt: null,
  };
}
