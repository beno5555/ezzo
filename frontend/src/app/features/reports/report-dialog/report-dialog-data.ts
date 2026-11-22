import { ReportTargetType } from '../report-target-type';

// What the opener gives the report dialog: what is reported.
export type ReportDialogData = {
  targetType: ReportTargetType;
  targetId: number;
};
