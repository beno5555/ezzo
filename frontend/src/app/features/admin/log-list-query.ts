import { PageQuery } from '../../core/http/page-query';
import { LogFilter } from './log-filter';

// The backend's LogQueryDto: a page of the list, and the filter.
export type LogListQuery = PageQuery & LogFilter;
