import { ReportTargetType } from './report-target-type';

// What a user sends to report a post, a comment or a user: CreateReportDto.
export type NewReport = {
  targetType: ReportTargetType;
  targetId: number;
  reason: string;
};
