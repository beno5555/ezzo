// The backend's ReportTargetType (Common/ProjectConstants/Enums/ReportTargetType.cs), sent as the member's
// name: the backend refuses a number (ReportTargetTypeJsonConverter).
export const ReportTargetType = {
  Post: 'Post',
  Comment: 'Comment',
  User: 'User',
} as const;
export type ReportTargetType = (typeof ReportTargetType)[keyof typeof ReportTargetType];
