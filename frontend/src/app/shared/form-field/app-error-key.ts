// The error keys AppValidators set and fieldErrorMessage reads. Angular's own (required, minlength,
// maxlength) keep the names Angular gives them.
export const AppErrorKey = {
  UsernameCharacters: 'usernameCharacters',
  EmailFormat: 'emailFormat',
  FutureDate: 'futureDate',
  TooYoung: 'tooYoung',
  TooOld: 'tooOld',
  PasswordMismatch: 'passwordMismatch',
} as const;
export type AppErrorKey = (typeof AppErrorKey)[keyof typeof AppErrorKey];
