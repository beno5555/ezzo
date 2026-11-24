import { isFromProfile, profileOrigin } from './new-post-origin';

describe('isFromProfile', () => {
  it('is true for the state a profile button hands over', () => {
    expect(isFromProfile(profileOrigin)).toBe(true);
  });

  it('is false with no state, with another state, and when the flag is not true', () => {
    expect(isFromProfile(undefined)).toBe(false);
    expect(isFromProfile(null)).toBe(false);
    expect(isFromProfile({ notice: 'x' })).toBe(false);
    expect(isFromProfile({ fromProfile: 'yes' })).toBe(false);
    expect(isFromProfile('fromProfile')).toBe(false);
  });
});
