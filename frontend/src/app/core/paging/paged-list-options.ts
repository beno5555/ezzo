import { AppResult } from '../http/app-result';
import { PageQuery } from '../http/page-query';

// What a PagedList needs: the …Api method that reads one page, the page size it asks for, and the key that
// tells two items apart (a post's id), used to drop an item a later page repeats.
export type PagedListOptions<T> = {
  loadPage: (query: PageQuery) => Promise<AppResult<T[]>>;
  pageSize: number;
  keyOf: (item: T) => number | string;
};
