// What another page sent the user to sign-in after, shown at the form's top (LandingPageState).
export const SignInNotice = {
  AccountCreated: 'accountCreated',
  AccountReactivated: 'accountReactivated',
  // After the settings page signed the user out of their own deactivated or deleted account.
  AccountDeactivated: 'accountDeactivated',
  AccountDeleted: 'accountDeleted',
  PasswordReset: 'passwordReset',
} as const;
export type SignInNotice = (typeof SignInNotice)[keyof typeof SignInNotice];
