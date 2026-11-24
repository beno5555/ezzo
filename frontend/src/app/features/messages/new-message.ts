// What the message box sends: text, the photos in the order they should show, or both. A message needs
// text or at least one photo (canSendMessage, and the backend's MessageTextOrImageRequired).
export type NewMessage = {
  content: string;
  photos: File[];
};
