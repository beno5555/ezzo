import { ReportStatus } from './report-status';
import { ReportTargetType } from './report-target-type';

// What the administrator narrows the reports to. A filter left out is no filter, except the status: the
// backend lists pending reports when it is absent.
export type ReportFilter = {
  status?: ReportStatus;
  targetType?: ReportTargetType;
};
