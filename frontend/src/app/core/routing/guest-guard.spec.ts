import { guestGuard } from './guest-guard';
import { runGuard } from './testing/run-guard';

describe('guestGuard', () => {
  it('lets a guest through', () => {
    const decision = runGuard(
      guestGuard,
      { isSignedIn: false, isAdministrator: false },
      '/sign-in',
    );

    expect(decision).toBe(true);
  });

  it('sends a signed-in user to the home address', () => {
    const decision = runGuard(guestGuard, { isSignedIn: true, isAdministrator: false }, '/sign-in');

    expect(decision).toBe('/');
  });
});
