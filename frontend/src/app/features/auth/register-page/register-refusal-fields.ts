// The register endpoint refuses a taken username or email with a plain message, not a field error, so
// the page matches the message to put it beside its field. Mirrored by hand from
// backend/aspnetproject/Common/ProjectConstants/ResponseMessages.cs (UsernameIsAlreadyTaken,
// EmailIsAlreadyTaken); a reserved username gets the same message as a taken one. The message is shown
// as it arrives, never translated. A message not listed here shows above the submit button instead.
export const registerRefusalFields: Readonly<Record<string, 'username' | 'email'>> = {
  'Username is already taken': 'username',
  'Email is already taken': 'email',
};
