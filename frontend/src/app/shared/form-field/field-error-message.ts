import { ValidationErrors } from '@angular/forms';
import { Dictionary } from '../../core/languages/dictionary';
import { AppErrorKey } from './app-error-key';

export type FieldErrorTexts = Dictionary['shared']['formField']['errors'];

// The error key that holds the server's messages for a field (applyFieldErrors, setServerErrors).
export const serverErrorKey = 'server';

type ErrorText = (error: unknown, texts: FieldErrorTexts) => string;

// The text for each error a field can carry, in the order they are looked at: the server's word first,
// since it is the latest, then the browser's own checks. An error not listed gets texts.invalid.
// A validator that brings a new error key adds its text here.
const errorTexts: Record<string, ErrorText> = {
  [serverErrorKey]: (error, texts) => serverMessage(error) ?? texts.invalid,
  required: (_error, texts) => texts.required,
  minlength: (error, texts) => texts.minLength(requiredLengthOf(error)),
  maxlength: (error, texts) => texts.maxLength(requiredLengthOf(error)),
  [AppErrorKey.UsernameCharacters]: (_error, texts) => texts.usernameCharacters,
  [AppErrorKey.EmailFormat]: (_error, texts) => texts.emailFormat,
  [AppErrorKey.FutureDate]: (_error, texts) => texts.futureDate,
  [AppErrorKey.TooYoung]: (error, texts) => texts.tooYoung(numberIn(error, 'minAge')),
  [AppErrorKey.TooOld]: (error, texts) => texts.tooOld(numberIn(error, 'maxAge')),
  [AppErrorKey.PasswordMismatch]: (_error, texts) => texts.passwordMismatch,
};

// The one message a field shows for its errors, or null when it has none.
export function fieldErrorMessage(
  errors: ValidationErrors | null,
  texts: FieldErrorTexts,
): string | null {
  let message: string | null = null;

  if (errors !== null) {
    const key = Object.keys(errorTexts).find((candidate) => candidate in errors);
    message = key === undefined ? texts.invalid : errorTexts[key](errors[key], texts);
  }

  return message;
}

function serverMessage(error: unknown): string | null {
  const isMessageList =
    Array.isArray(error) && error.length > 0 && error.every((item) => typeof item === 'string');

  return isMessageList ? error.join(' ') : null;
}

// Angular's minlength and maxlength errors carry { requiredLength, actualLength }.
function requiredLengthOf(error: unknown): number {
  return numberIn(error, 'requiredLength');
}

// A number an error carries, such as AppValidators' { minAge }; 0 when it carries none.
function numberIn(error: unknown, key: string): number {
  const value = hasKey(error, key) ? error[key] : undefined;
  return typeof value === 'number' ? value : 0;
}

function hasKey<TKey extends string>(error: unknown, key: TKey): error is Record<TKey, unknown> {
  return typeof error === 'object' && error !== null && key in error;
}
