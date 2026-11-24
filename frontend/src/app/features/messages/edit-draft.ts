import { StandardMessageDto } from './standard-message-dto';

// An edit the user is writing in the message box (ConversationsStore.editDraft): the message as the server
// holds it, and the text the box opens with, which is the message's text, or what a refused edit's author
// had written.
export type EditDraft = {
  message: StandardMessageDto;
  content: string;
};
