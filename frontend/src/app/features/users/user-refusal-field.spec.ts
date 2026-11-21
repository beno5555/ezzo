import { userRefusalField } from './user-refusal-field';

describe('userRefusalField', () => {
  it.each([
    ['Username is already taken', 'username'],
    ['Email is already taken', 'email'],
    ['Username can be changed again on 2026-12-01', 'username'],
  ])('puts "%s" beside the %s field', (message, field) => {
    expect(userRefusalField(message)).toBe(field);
  });

  it.each(['User not found', 'Some fields are not valid.', ''])(
    'puts "%s" beside no field',
    (message) => {
      expect(userRefusalField(message)).toBeNull();
    },
  );
});
