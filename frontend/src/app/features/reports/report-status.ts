// The backend's ReportStatus (Common/ProjectConstants/Enums/ReportStatus.cs), sent as the member's name.
export const ReportStatus = {
  Pending: 'Pending',
  Resolved: 'Resolved',
  Rejected: 'Rejected',
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];
