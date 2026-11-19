// What another page sent the user to sign-in after, shown at the form's top (SignInPageState).
export const SignInNotice = {
  AccountCreated: 'accountCreated',
  AccountReactivated: 'accountReactivated',
  PasswordReset: 'passwordReset',
} as const;
export type SignInNotice = (typeof SignInNotice)[keyof typeof SignInNotice];
