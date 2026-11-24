// The names the backend shows in place of an account that is deactivated or deleted
// (backend/aspnetproject/Common/ProjectConstants/ResponseMessages.cs). No user can take them, so a row that
// carries one cannot be addressed by its username.
const unavailableUsernames: readonly string[] = ['account_deactivated', 'account_deleted'];

export function isUnavailableUsername(username: string): boolean {
  return unavailableUsernames.includes(username);
}
