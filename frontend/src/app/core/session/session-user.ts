import { RoleName } from './role-name';

// Who is signed in, as decoded from the access token.
export type SessionUser = {
  id: number;
  username: string;
  roles: RoleName[];
};
