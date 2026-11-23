import { Relationship } from '../friendships/relationship';

// A row of the user search. relationship is the signed-in caller's friendship with this user: null for a
// guest, for the caller's own row and for a user the caller has no friendship with. The search never returns
// a deactivated or deleted account, so the id is always there.
export type SearchUserDto = {
  id: number;
  username: string;
  relationship: Relationship | null;
};
