import { RoleName } from './role-name';

// What the frontend reads from an access token. It decides only what the UI shows; the backend enforces access.
export type AccessTokenClaims = {
  id: number;
  username: string;
  roles: RoleName[];
  // Milliseconds since the epoch, comparable with Date.now().
  expiresAt: number;
};
