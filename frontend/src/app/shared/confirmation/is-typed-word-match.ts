// Whether the word typed into a typed confirmation unlocks its confirm button: the exact word, in the
// same letter case, with only the spaces around it ignored, since a paste often brings them.
export function isTypedWordMatch(typed: string, word: string): boolean {
  return typed.trim() === word;
}
