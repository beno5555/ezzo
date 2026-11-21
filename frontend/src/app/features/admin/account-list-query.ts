import { PageQuery } from '../../core/http/page-query';
import { AccountState } from './account-state';

// The backend's AccountListQuery. A filter left out matches every account; username matches any part of
// the name.
export type AccountListQuery = PageQuery & {
  state?: AccountState;
  username?: string;
};
