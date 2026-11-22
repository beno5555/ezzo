import { PageLoadStatus } from '../../core/paging/page-load-status';
import { DisplayFriendDto } from '../friendships/display-friend-dto';
import { ConversationOpenStatus } from './conversation-open-status';
import { StandardMessageDto } from './standard-message-dto';

// The conversation shown at /messages/:username. username is as the address gave it; friend is null until
// it is known. messages run oldest first, and older pages are put above them (historyStatus says how far);
// messages that arrive or are sent go below.
export type OpenConversation = {
  username: string;
  status: ConversationOpenStatus;
  // The text of a failed lookup, null otherwise.
  failureMessage: string | null;
  friend: DisplayFriendDto | null;
  messages: readonly StandardMessageDto[];
  historyStatus: PageLoadStatus;
  // The text of the last failed page of the history, null once a page arrives.
  historyFailure: string | null;
  // The user's messages still on their way to the server, shown with the clock instead of their time: new
  // ones, which come last in messages with negative ids and preview addresses for their photos, and edited
  // ones, which sit in their place in messages with the new text.
  sendingIds: ReadonlySet<number>;
  // The messages whose deletion was confirmed and that are fading out before they leave.
  fadingIds: ReadonlySet<number>;
};
