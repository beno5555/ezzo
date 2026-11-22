// The backend's ReportTargetType (Common/ProjectConstants/Enums/ReportTargetType.cs), sent as the member's
// name: the backend refuses a number (ReportTargetTypeJsonConverter). The backend also has User, which
// arrives with the profile page's Report entry.
export const ReportTargetType = {
  Post: 'Post',
  Comment: 'Comment',
} as const;
export type ReportTargetType = (typeof ReportTargetType)[keyof typeof ReportTargetType];
