import { isUserAvailable } from './is-user-available';

describe('isUserAvailable', () => {
  it('is true for an account that is in use', () => {
    expect(isUserAvailable({ id: 9, username: 'alice' })).toBe(true);
  });

  it('is false when the backend sends no id, as it does on the public endpoints', () => {
    expect(isUserAvailable({ id: null, username: 'account_deactivated' })).toBe(false);
  });

  it.each(['account_deactivated', 'account_deleted'])(
    'is false for the name %s even when the backend sends the id, as the admin endpoints do',
    (username) => {
      expect(isUserAvailable({ id: 9, username })).toBe(false);
    },
  );
});
