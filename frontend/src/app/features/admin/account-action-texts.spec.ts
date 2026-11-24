import { english } from '../../core/languages/english';
import {
  accountActionConfirmation,
  accountActionLabel,
  isAccountActionDestructive,
} from './account-action-texts';
import { AccountRowAction } from './account-row-action';

const text = english.admin.users;

describe('accountActionConfirmation', () => {
  it('asks about the account by name, with the action as the confirm button', () => {
    expect(accountActionConfirmation(text, AccountRowAction.Delete, 'john_doe')).toEqual({
      question: 'Delete john_doe?',
      detail: text.confirmations.delete.detail,
      confirmButton: 'Delete',
      isDestructive: true,
    });
  });

  it.each(Object.values(AccountRowAction))('has a question for %s', (action) => {
    const confirmation = accountActionConfirmation(text, action, 'john_doe');

    expect(confirmation.question).toContain('john_doe');
    expect(confirmation.confirmButton).not.toBe('');
  });
});

describe('isAccountActionDestructive', () => {
  it.each([
    [AccountRowAction.Deactivate, true],
    [AccountRowAction.Delete, true],
    [AccountRowAction.RemoveAdministrator, true],
    [AccountRowAction.Restore, false],
    [AccountRowAction.GrantAdministrator, false],
  ])('is %s -> %s', (action, expected) => {
    expect(isAccountActionDestructive(action)).toBe(expected);
  });
});

describe('accountActionLabel', () => {
  it('names each action in the menu', () => {
    expect(accountActionLabel(text, AccountRowAction.GrantAdministrator)).toBe(
      'Make administrator',
    );
    expect(accountActionLabel(text, AccountRowAction.Restore)).toBe('Restore');
  });
});
