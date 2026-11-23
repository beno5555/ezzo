import { HttpParams } from '@angular/common/http';
import { PageQuery } from './page-query';

// The query parameters every paged list of the backend takes (PageQuery): which page, and how long it is.
// An …Api method adds its own filters to what this returns.
export function pageParams(query: PageQuery): HttpParams {
  return new HttpParams().set('pageNumber', query.pageNumber).set('pageSize', query.pageSize);
}
