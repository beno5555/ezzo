import { LIMITS } from '../../core/limits';
import { dayInMilliseconds } from '../../core/time/minute-clock';

// The moment a username can change again: the cooldown after the time it was last changed, counted in
// whole days of 24 hours as the backend counts them (UserService.EditUserProfileAsync).
export function usernameChangeOpensAt(lastChangedAt: string): string {
  const cooldown = LIMITS.users.usernameChangeCooldownDays * dayInMilliseconds;

  return new Date(Date.parse(lastChangedAt) + cooldown).toISOString();
}
