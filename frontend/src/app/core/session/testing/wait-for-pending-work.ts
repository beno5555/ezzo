// Lets queued promise callbacks and lock turns run before a test looks at the outcome.
export function waitForPendingWork(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}
