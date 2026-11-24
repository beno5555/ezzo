// What an administrator can do to an account from its row. Edit is not here: it opens a form and
// confirms nothing.
export const AccountRowAction = {
  Deactivate: 'Deactivate',
  Restore: 'Restore',
  Delete: 'Delete',
  GrantAdministrator: 'GrantAdministrator',
  RemoveAdministrator: 'RemoveAdministrator',
} as const;
export type AccountRowAction = (typeof AccountRowAction)[keyof typeof AccountRowAction];
