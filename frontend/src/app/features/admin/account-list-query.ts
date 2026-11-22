import { PageQuery } from '../../core/http/page-query';
import { AccountFilter } from './account-filter';

// The backend's AccountListQuery: a page of the list, and the filter.
export type AccountListQuery = PageQuery & AccountFilter;
