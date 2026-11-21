// A date input holds yyyy-mm-dd. The backend sends a date of birth as midnight UTC, so its first ten
// characters are the calendar date the user entered, wherever the reader is.
export function toDateInputValue(isoDate: string): string {
  return isoDate.slice(0, 10);
}
