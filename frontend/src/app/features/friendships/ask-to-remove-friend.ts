import { ConfirmationOpener } from '../../shared/confirmation/confirmation-opener';

// What the question says: its words are the dictionary's `friendships.removeConfirmation`.
export type RemoveFriendTexts = {
  question: (username: string) => string;
  detail: string;
  confirmButton: string;
};

// Asks the user to confirm removing a friend, naming the loss of the messages, and answers whether they
// said yes. Shared by every page where Remove is a button (a profile, the friends page, the search).
export function askToRemoveFriend(
  confirmationOpener: ConfirmationOpener,
  texts: RemoveFriendTexts,
  username: string,
): Promise<boolean> {
  return confirmationOpener.ask({
    question: texts.question(username),
    detail: texts.detail,
    confirmButton: texts.confirmButton,
    isDestructive: true,
  });
}
