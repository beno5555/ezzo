import { MinimalUserDto } from './minimal-user-dto';
import { isUnavailableUsername } from './unavailable-username';

// Whether a user can be shown with a profile link and a picture. The public endpoints send no id for an
// account that is deactivated or deleted; the admin endpoints send the id anyway and show the account under
// a placeholder name, so the name is checked too.
export function isUserAvailable(user: MinimalUserDto): boolean {
  return user.id !== null && !isUnavailableUsername(user.username);
}
