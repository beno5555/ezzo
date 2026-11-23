// The backend's ReportDecision (Common/ProjectConstants/Enums/ReportDecision.cs), sent as the member's name:
// the backend refuses a number (ReportDecisionJsonConverter).
export const ReportDecision = {
  Hide: 'Hide',
  Reject: 'Reject',
} as const;
export type ReportDecision = (typeof ReportDecision)[keyof typeof ReportDecision];
