import { DisplayFriendDto } from '../friendships/display-friend-dto';

// A row of the conversation list: the friend, the last message and how many of their messages are unread.
export type ConversationFriendDto = {
  conversationFriend: DisplayFriendDto;
  lastMessageContent: string;
  lastMessageSentAt: string;
  lastMessageSenderId: number;
  // Lets the list show something for a last message that is a photo with no text.
  lastMessageImageCount: number;
  unreadCount: number;
};
