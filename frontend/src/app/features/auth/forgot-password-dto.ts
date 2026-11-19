// The backend's ForgotPasswordDto. redirectUrl is the page the email's link opens, with ?token=… added.
export type ForgotPasswordDto = {
  email: string;
  redirectUrl: string;
};
