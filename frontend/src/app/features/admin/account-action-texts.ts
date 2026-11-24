import { ConfirmationQuestion } from '../../shared/confirmation/confirmation-question';
import { Dictionary } from '../../core/languages/dictionary';
import { AccountRowAction } from './account-row-action';

type UsersText = Dictionary['admin']['users'];

// Where each row action's texts are in the dictionary: its menu entry under actions, and its question
// under confirmations (the same key in both).
const textKeys = {
  [AccountRowAction.Deactivate]: 'deactivate',
  [AccountRowAction.Restore]: 'restore',
  [AccountRowAction.Delete]: 'delete',
  [AccountRowAction.GrantAdministrator]: 'grantAdministrator',
  [AccountRowAction.RemoveAdministrator]: 'removeAdministrator',
} as const satisfies Record<AccountRowAction, keyof UsersText['confirmations']>;

// The actions that take something away get the danger look on their confirm button. Restoring and
// granting give something.
const destructiveActions: readonly AccountRowAction[] = [
  AccountRowAction.Deactivate,
  AccountRowAction.Delete,
  AccountRowAction.RemoveAdministrator,
];

export function accountActionLabel(text: UsersText, action: AccountRowAction): string {
  return text.actions[textKeys[action]];
}

export function isAccountActionDestructive(action: AccountRowAction): boolean {
  return destructiveActions.includes(action);
}

// The question the page asks before it runs the action on the account named username.
export function accountActionConfirmation(
  text: UsersText,
  action: AccountRowAction,
  username: string,
): ConfirmationQuestion {
  const confirmation = text.confirmations[textKeys[action]];

  return {
    question: confirmation.question(username),
    detail: confirmation.detail,
    confirmButton: confirmation.confirmButton,
    isDestructive: isAccountActionDestructive(action),
  };
}
