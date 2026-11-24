import { toDateInputValue } from './to-date-input-value';

// The fields of a profile form (username, date of birth, bio) filled from a profile the backend returned:
// the date of birth as the calendar date a date input holds, and no bio as an empty box.
export function toProfileFormValue(profile: {
  username: string;
  dateOfBirth: string;
  bio: string | null;
}): { username: string; dateOfBirth: string; bio: string } {
  return {
    username: profile.username,
    dateOfBirth: toDateInputValue(profile.dateOfBirth),
    bio: profile.bio ?? '',
  };
}
