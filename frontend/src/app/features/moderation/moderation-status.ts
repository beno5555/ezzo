// The backend's ModerationStatus (Common/ProjectConstants/Enums/ModerationStatus.cs), sent as the member's
// name: the backend refuses a number (ModerationStatusJsonConverter). Flagged is the automation's and the
// reports queue's, so the menu only sends Visible and Hidden.
export const ModerationStatus = {
  Visible: 'Visible',
  Flagged: 'Flagged',
  Hidden: 'Hidden',
} as const;
export type ModerationStatus = (typeof ModerationStatus)[keyof typeof ModerationStatus];
