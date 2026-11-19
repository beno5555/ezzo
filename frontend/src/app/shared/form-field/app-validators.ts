import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { LIMITS } from '../../core/limits';
import { AppErrorKey } from './app-error-key';

// Validators for rules Angular's own do not cover. Each brings its own error key, so fieldErrorMessage
// can say what is wrong; Validators.pattern would only say "pattern". An empty value passes each of them,
// leaving it to Validators.required.
export const AppValidators = {
  // Letters, digits, _ and -, with at least one letter (RegisterDto).
  usernameCharacters: matching(LIMITS.users.usernamePattern, AppErrorKey.UsernameCharacters),

  // Something, @, a domain with a dot (RegisterDto).
  emailFormat: matching(LIMITS.users.emailPattern, AppErrorKey.EmailFormat),

  // A date of birth, yyyy-mm-dd, for someone between minAge and maxAge years old on today's UTC date, as
  // the backend's ValidAgeAttribute counts it. now is for tests.
  ageBetween(minAge: number, maxAge: number, now: () => Date = () => new Date()): ValidatorFn {
    return (control: AbstractControl<string>): ValidationErrors | null => {
      let errors: ValidationErrors | null = null;
      const dateOfBirth = parseDate(control.value);

      if (dateOfBirth !== null) {
        const today = utcDateOf(now());
        const age = yearsBetween(dateOfBirth, today);
        const isInFuture = dateOfBirth > today;
        const isTooYoung = age < minAge;
        const isTooOld = age > maxAge;

        if (isInFuture) {
          errors = { [AppErrorKey.FutureDate]: true };
        } else if (isTooYoung) {
          errors = { [AppErrorKey.TooYoung]: { minAge } };
        } else if (isTooOld) {
          errors = { [AppErrorKey.TooOld]: { maxAge } };
        }
      }

      return errors;
    };
  },
};

function matching(pattern: RegExp, errorKey: AppErrorKey): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const isFilledWrongly = control.value !== '' && !pattern.test(control.value);
    return isFilledWrongly ? { [errorKey]: true } : null;
  };
}

// A yyyy-mm-dd value as a UTC midnight, or null for an empty or unfinished one.
function parseDate(value: string): Date | null {
  const isCalendarDate = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = isCalendarDate ? new Date(`${value}T00:00:00Z`) : null;
  const isRealDate = date !== null && !Number.isNaN(date.getTime());
  return isRealDate ? date : null;
}

function utcDateOf(moment: Date): Date {
  return new Date(Date.UTC(moment.getUTCFullYear(), moment.getUTCMonth(), moment.getUTCDate()));
}

// Whole years from one UTC date to a later one: one less until the birthday comes round.
function yearsBetween(from: Date, to: Date): number {
  const years = to.getUTCFullYear() - from.getUTCFullYear();
  const birthdayThisYear = new Date(
    Date.UTC(to.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
  );
  const birthdayStillAhead = birthdayThisYear > to;
  return birthdayStillAhead ? years - 1 : years;
}
