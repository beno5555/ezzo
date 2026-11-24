import { adminGuard } from './admin-guard';
import { runGuard } from './testing/run-guard';

describe('adminGuard', () => {
  it('lets an administrator through', () => {
    const decision = runGuard(
      adminGuard,
      { isSignedIn: true, isAdministrator: true },
      '/admin/users',
    );

    expect(decision).toBe(true);
  });

  it('turns a signed-in user without the role away to the home address', () => {
    const decision = runGuard(
      adminGuard,
      { isSignedIn: true, isAdministrator: false },
      '/admin/users',
    );

    expect(decision).toBe('/');
  });

  it('sends a guest to sign-in, remembering the wanted address', () => {
    const decision = runGuard(
      adminGuard,
      { isSignedIn: false, isAdministrator: false },
      '/admin/logs',
    );

    expect(decision).toBe('/?returnUrl=%2Fadmin%2Flogs');
  });
});
