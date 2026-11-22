import { minuteInMilliseconds } from '../../core/time/minute-clock';
import { StandardMessageDto } from './standard-message-dto';

// The longest pause between two messages from the same sender that still keeps them in one run.
export const runPauseInMilliseconds = 2 * minuteInMilliseconds;

// The ids of the messages that end a run: messages from one sender, each sent within runPauseInMilliseconds
// of the one before, with nothing from the other person between them. Only the last message of a run shows
// its time, so a burst of messages reads as one. messages run oldest first, as OpenConversation keeps them.
export function runEnds(messages: readonly StandardMessageDto[]): ReadonlySet<number> {
  const ends = new Set<number>();

  messages.forEach((message, index) => {
    const next = messages[index + 1];
    const continuesRun =
      next !== undefined &&
      next.sender.id === message.sender.id &&
      Date.parse(next.sentAt) - Date.parse(message.sentAt) <= runPauseInMilliseconds;

    if (!continuesRun) {
      ends.add(message.id);
    }
  });

  return ends;
}
