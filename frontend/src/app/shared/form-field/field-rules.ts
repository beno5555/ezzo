import { ValidatorFn, Validators } from '@angular/forms';
import { LIMITS } from '../../core/limits';
import { AppValidators } from './app-validators';

// The validators of a field that more than one form asks for, so that a rule changes in one place. A
// form writes `email: ['', FieldRules.email]`.
export const FieldRules = {
  username: [
    Validators.required,
    Validators.minLength(LIMITS.users.usernameMinLength),
    Validators.maxLength(LIMITS.users.usernameMaxLength),
    AppValidators.usernameCharacters,
  ],
  email: [
    Validators.required,
    Validators.minLength(LIMITS.users.emailMinLength),
    Validators.maxLength(LIMITS.users.emailMaxLength),
    AppValidators.emailFormat,
  ],
  password: [
    Validators.required,
    Validators.minLength(LIMITS.users.passwordMinLength),
    Validators.maxLength(LIMITS.users.passwordMaxLength),
  ],
  dateOfBirth: [
    Validators.required,
    AppValidators.ageBetween(LIMITS.users.minAge, LIMITS.users.maxAge),
  ],
  bio: [Validators.maxLength(LIMITS.users.bioMaxLength)],
} satisfies Record<string, ValidatorFn[]>;
