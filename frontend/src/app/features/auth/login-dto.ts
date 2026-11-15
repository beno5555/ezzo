// The backend's LoginDto. uniqueIdentifier is a username or an email.
export type LoginDto = {
  uniqueIdentifier: string;
  password: string;
};
