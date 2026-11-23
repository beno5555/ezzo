import { authGuard } from './auth-guard';
import { runGuard } from './testing/run-guard';

describe('authGuard', () => {
  it('lets a signed-in user through', () => {
    const decision = runGuard(authGuard, { isSignedIn: true, isAdministrator: false }, '/settings');

    expect(decision).toBe(true);
  });

  it('sends a guest to sign-in, remembering the wanted address', () => {
    const decision = runGuard(
      authGuard,
      { isSignedIn: false, isAdministrator: false },
      '/messages/john_doe?draft=1',
    );

    expect(decision).toBe('/?returnUrl=%2Fmessages%2Fjohn_doe%3Fdraft%3D1');
  });
});
