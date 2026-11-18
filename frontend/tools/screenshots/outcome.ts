// The result of a step of the screenshot command that can fail: the value, or a message for whoever runs it.
// The app's AppResult carries an HTTP status, which none of these steps has.
export type Outcome<T> = { succeeded: true; data: T } | { succeeded: false; message: string };

export const ok = <T>(data: T): Outcome<T> => ({ succeeded: true, data });
export const fail = <T>(message: string): Outcome<T> => ({ succeeded: false, message });
