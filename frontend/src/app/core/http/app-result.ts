export type FieldErrors = Record<string, string[]>;

export type AppResult<T> =
  | { succeeded: true; message?: string; data: T }
  | { succeeded: false; message: string; status: number; fieldErrors?: FieldErrors };

export const ok = <T>(data: T, message?: string): AppResult<T> => ({
  succeeded: true,
  data,
  message,
});

export const fail = <T>(
  message: string,
  status: number,
  fieldErrors?: FieldErrors,
): AppResult<T> => ({
  succeeded: false,
  message,
  status,
  fieldErrors,
});
