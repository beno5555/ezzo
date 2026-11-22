// The backend's EditUserDto. dateOfBirth is a calendar date, yyyy-mm-dd, as a date input gives it; bio is
// null when left empty, since the backend refuses an empty one.
export type EditUserDto = {
  username: string;
  dateOfBirth: string;
  bio: string | null;
};
