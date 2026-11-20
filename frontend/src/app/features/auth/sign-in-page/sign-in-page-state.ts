import { SignInNotice } from './sign-in-notice';

// What another page hands to sign-in in the navigation's state, kept out of the address so that a
// username or an email never lands in the history or a shared link:
// - identifier: filled in, the username after a registration whose sign-in failed
// - notice: shown at the form's top, after a registration, a reactivation or a password reset
export type SignInPageState = {
  identifier?: string;
  notice?: SignInNotice;
};

const notices: readonly unknown[] = Object.values(SignInNotice);

// The navigation's state as SignInPageState; anything else in it, or no state at all, is left out.
export function toSignInPageState(state: unknown): SignInPageState {
  const pageState: SignInPageState = {};

  if (typeof state === 'object' && state !== null) {
    if ('identifier' in state && typeof state.identifier === 'string') {
      pageState.identifier = state.identifier;
    }
    if ('notice' in state && isSignInNotice(state.notice)) {
      pageState.notice = state.notice;
    }
  }

  return pageState;
}

function isSignInNotice(value: unknown): value is SignInNotice {
  return notices.includes(value);
}
