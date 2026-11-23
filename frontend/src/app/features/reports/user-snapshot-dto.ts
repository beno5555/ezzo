// What an administrator sees of a reported user (UserSnapshotDto): the real username, whatever the state of
// the account, and the bio, which is null when the user wrote none.
export type UserSnapshotDto = {
  id: number;
  username: string;
  bio: string | null;
};
