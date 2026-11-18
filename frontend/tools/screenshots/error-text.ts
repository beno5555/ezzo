// The text of anything a Playwright call threw.
export function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
