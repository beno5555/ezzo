// The backend's ResetPasswordDto. token is the one the reset email's link carries.
export type ResetPasswordDto = {
  token: string;
  newPassword: string;
};
