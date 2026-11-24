// What a confirmation asks. All texts come from the caller's dictionary entries.
//   question:      the heading, such as "Delete this post?"
//   detail:        an optional sentence under it, such as what cannot be undone
//   confirmButton: the confirm button's text, such as "Delete"
//   isDestructive: the confirm button takes the danger look rather than the primary one
//   typedWord:     the typed variant: the confirm button works only once this word is typed (or a whole
//                  sentence, typed exactly as shown)
export type ConfirmationQuestion = {
  question: string;
  detail?: string;
  confirmButton: string;
  isDestructive: boolean;
  typedWord?: string;
};
