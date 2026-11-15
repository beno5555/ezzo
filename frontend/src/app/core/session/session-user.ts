// Who is signed in, as decoded from the access token.
export type SessionUser = {
  id: number;
  username: string;
  roles: string[];
};
