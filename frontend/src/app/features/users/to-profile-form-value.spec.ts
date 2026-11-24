import { toProfileFormValue } from './to-profile-form-value';

describe('toProfileFormValue', () => {
  const profile = { username: 'john_doe', dateOfBirth: '2000-04-01T00:00:00Z', bio: 'Hi' };

  it('gives the date of birth as the calendar date and keeps the rest', () => {
    expect(toProfileFormValue(profile)).toEqual({
      username: 'john_doe',
      dateOfBirth: '2000-04-01',
      bio: 'Hi',
    });
  });

  it('shows no bio as an empty box', () => {
    expect(toProfileFormValue({ ...profile, bio: null }).bio).toBe('');
  });
});
