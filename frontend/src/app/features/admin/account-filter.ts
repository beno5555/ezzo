import { AccountState } from './account-state';

// What the users table is filtered by. A filter left out matches every account; username matches any part
// of the name.
export type AccountFilter = {
  state?: AccountState;
  username?: string;
};
