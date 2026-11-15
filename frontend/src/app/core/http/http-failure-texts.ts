// The fixed texts for failures that bring no message of their own.
// Temporary: ticket 03 moves them into the dictionaries.
export const httpFailureTexts = {
  validation: 'Some fields are not valid.',
  unauthorized: 'Please sign in to continue.',
  forbidden: 'You are not allowed to do this.',
  notFound: 'This was not found.',
  network: 'Could not reach WebCity. Check your connection and try again.',
  unexpected: 'Something went wrong. Please try again.',
} as const;
