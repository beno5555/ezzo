// The backend's RoleName enum (Common/ProjectConstants/Enums/RoleName.cs), as it travels in the role claim.
export const RoleName = { User: 'User', Administrator: 'Administrator' } as const;
export type RoleName = (typeof RoleName)[keyof typeof RoleName];

const roleNames: readonly unknown[] = Object.values(RoleName);

export function isRoleName(value: unknown): value is RoleName {
  return roleNames.includes(value);
}
