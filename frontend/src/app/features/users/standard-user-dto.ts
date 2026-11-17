// A user as the public reads by id and by username return it.
export type StandardUserDto = {
  id: number;
  username: string;
  bio: string | null;
  // A calendar date at midnight UTC: format it in UTC.
  dateOfBirth: string;
};
