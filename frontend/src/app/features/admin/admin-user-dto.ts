import { AccountState } from './account-state';

// An account as the administrator's list returns it, in any state (the backend's AdminUserDto). Times
// are UTC ISO strings; deactivatedAt and deletedAt are null while the account is not deactivated or deleted.
export type AdminUserDto = {
  id: number;
  username: string;
  email: string;
  isAdministrator: boolean;
  state: AccountState;
  registeredAt: string;
  deactivatedAt: string | null;
  deletedAt: string | null;
};
