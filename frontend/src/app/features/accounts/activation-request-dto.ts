// The backend's ActivationRequestDto. redirectUrl is the page the email's link opens, with ?token=… added.
export type ActivationRequestDto = {
  email: string;
  redirectUrl: string;
};
