import { ReportStatus } from './report-status';
import { ReportTargetType } from './report-target-type';

// The reporter's view of the report just made (StandardReportDto).
export type StandardReportDto = {
  id: number;
  targetType: ReportTargetType;
  targetId: number;
  reason: string;
  status: ReportStatus;
  createdAt: string;
};
