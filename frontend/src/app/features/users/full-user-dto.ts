// A user as the backend returns the account's owner, or an administrator who created or edited it
// (the backend's FullUserDto). Times are UTC ISO strings; dateOfBirth is a calendar date at midnight UTC.
export type FullUserDto = {
  id: number;
  username: string;
  email: string;
  bio: string | null;
  roles: string[];
  registeredAt: string;
  dateOfBirth: string;
  // Null when the username was never changed.
  usernameLastChangedAt: string | null;
};
