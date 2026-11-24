import { Dictionary } from '../../core/languages/dictionary';
import { appAddresses } from '../../core/routing/app-addresses';
import { countBadgeText } from '../../core/shell/count-badge/count-badge-text';
import { DisplayFriendDto } from '../friendships/display-friend-dto';
import { isUnavailableUsername } from '../users/unavailable-username';
import { ConversationFriendDto } from './conversation-friend-dto';

// A row of the conversation list as the list shows it.
export type ConversationRow = {
  friend: DisplayFriendDto;
  // Null for an account that is deactivated or deleted: its placeholder name addresses nobody.
  address: string[] | null;
  // The last message's text, or "Photo" when it has photos and no text; marked when the user sent it.
  preview: string;
  isPhoto: boolean;
  sentAt: string;
  // The unread count as the badge writes it, null when nothing is unread.
  badge: string | null;
};

export function toConversationRow(
  row: ConversationFriendDto,
  signedInUserId: number | null,
  listTexts: Dictionary['messages']['list'],
): ConversationRow {
  const friend = row.conversationFriend;
  const hasText = row.lastMessageContent.trim() !== '';
  const isPhoto = !hasText && row.lastMessageImageCount > 0;
  const shownText = isPhoto ? listTexts.photo : row.lastMessageContent;
  const isOwn = row.lastMessageSenderId === signedInUserId;
  const isAddressable = !isUnavailableUsername(friend.username);

  return {
    friend,
    address: isAddressable ? appAddresses.conversation(friend.username) : null,
    preview: isOwn ? listTexts.ownMessage(shownText) : shownText,
    isPhoto,
    sentAt: row.lastMessageSentAt,
    badge: countBadgeText(row.unreadCount),
  };
}
