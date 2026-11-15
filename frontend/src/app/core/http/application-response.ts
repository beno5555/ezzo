// The backend's envelope (Common/Domain/ApplicationResponse.cs), as it arrives in a response body.
export type ApplicationResponse<T> = {
  succeeded: boolean;
  message: string | null;
  data?: T;
};
