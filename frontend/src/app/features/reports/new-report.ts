import { ReportTargetType } from './report-target-type';

// What a user sends to report a post or a comment: CreateReportDto.
export type NewReport = {
  targetType: ReportTargetType;
  targetId: number;
  reason: string;
};
