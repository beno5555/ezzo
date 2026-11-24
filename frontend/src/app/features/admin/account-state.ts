// The backend's AccountState (Common/ProjectConstants/Enums/AccountState.cs), which travels as text. A
// soft-deleted account reads as SoftDeleted even if it was also deactivated.
export const AccountState = {
  Active: 'Active',
  Deactivated: 'Deactivated',
  SoftDeleted: 'SoftDeleted',
} as const;
export type AccountState = (typeof AccountState)[keyof typeof AccountState];
