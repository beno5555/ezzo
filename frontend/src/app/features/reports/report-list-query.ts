import { PageQuery } from '../../core/http/page-query';
import { ReportFilter } from './report-filter';

// The backend's ReportListQuery: a page of the list, and the filter.
export type ReportListQuery = PageQuery & ReportFilter;
