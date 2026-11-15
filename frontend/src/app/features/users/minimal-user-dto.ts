// The id is null for an account that is deactivated or deleted.
export type MinimalUserDto = {
  id: number | null;
  username: string;
};
