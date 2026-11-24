// The endpoints that set a username or an email (registration, an administrator creating an account,
// editing a profile) refuse a taken or reserved username, a taken email and a username changed too
// soon with a plain message, not a field error, so the form matches the message to put it beside its
// field. Mirrored by hand from backend/aspnetproject/Common/ProjectConstants/ResponseMessages.cs
// (UsernameIsAlreadyTaken, EmailIsAlreadyTaken, UsernameCanBeChangedAgainOn); a reserved username gets
// the same message as a taken one. The message is shown as it arrives, never translated. A message
// that names no field shows above the submit button instead.
const refusalFields: Readonly<Record<string, UserRefusalField>> = {
  'Username is already taken': 'username',
  'Email is already taken': 'email',
};

// The cooldown message ends in the date the username can change again.
const usernameCooldownPrefix = 'Username can be changed again on';

export type UserRefusalField = 'username' | 'email';

// The field a refusal message belongs to, or null when it names none.
export function userRefusalField(message: string): UserRefusalField | null {
  const isCooldown = message.startsWith(usernameCooldownPrefix);

  return isCooldown ? 'username' : (refusalFields[message] ?? null);
}
