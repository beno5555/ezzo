import { english } from '../../core/languages/english';
import { ConversationFriendDto } from './conversation-friend-dto';
import { toConversationRow } from './conversation-row';

const signedInUserId = 1;
const listTexts = english.messages.list;

function dto(change: Partial<ConversationFriendDto>): ConversationFriendDto {
  return {
    conversationFriend: { id: 3, username: 'alice', lastActiveAt: null, isActive: true },
    lastMessageContent: 'See you there',
    lastMessageSentAt: '2026-11-17T09:00:00Z',
    lastMessageSenderId: 3,
    lastMessageImageCount: 0,
    unreadCount: 0,
    ...change,
  };
}

describe('toConversationRow', () => {
  it('shows the last message, its time, and the address of the conversation', () => {
    const row = toConversationRow(dto({}), signedInUserId, listTexts);

    expect(row.preview).toBe('See you there');
    expect(row.isPhoto).toBe(false);
    expect(row.sentAt).toBe('2026-11-17T09:00:00Z');
    expect(row.address).toEqual(['/messages', 'alice']);
  });

  it('reads "Photo" for a last message that has only photos', () => {
    const row = toConversationRow(
      dto({ lastMessageContent: '', lastMessageImageCount: 2 }),
      signedInUserId,
      listTexts,
    );

    expect(row.preview).toBe('Photo');
    expect(row.isPhoto).toBe(true);
  });

  it('counts text of only spaces as no text', () => {
    const row = toConversationRow(
      dto({ lastMessageContent: '   ', lastMessageImageCount: 1 }),
      signedInUserId,
      listTexts,
    );

    expect(row.preview).toBe('Photo');
  });

  it('shows the text of a last message that has text and photos', () => {
    const row = toConversationRow(dto({ lastMessageImageCount: 3 }), signedInUserId, listTexts);

    expect(row.preview).toBe('See you there');
    expect(row.isPhoto).toBe(false);
  });

  it('marks a last message the signed-in user sent', () => {
    const row = toConversationRow(
      dto({ lastMessageSenderId: signedInUserId }),
      signedInUserId,
      listTexts,
    );

    expect(row.preview).toBe('You: See you there');
  });

  it('gives the unread count as a badge, and none when nothing is unread', () => {
    expect(toConversationRow(dto({ unreadCount: 4 }), signedInUserId, listTexts).badge).toBe('4');
    expect(toConversationRow(dto({ unreadCount: 0 }), signedInUserId, listTexts).badge).toBeNull();
  });

  it('gives no address to an account that is no longer available', () => {
    const row = toConversationRow(
      dto({
        conversationFriend: {
          id: 3,
          username: 'account_deleted',
          lastActiveAt: '2026-11-01T00:00:00Z',
          isActive: false,
        },
      }),
      signedInUserId,
      listTexts,
    );

    expect(row.address).toBeNull();
  });
});
