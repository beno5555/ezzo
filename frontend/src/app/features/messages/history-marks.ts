import { minuteInMilliseconds } from '../../core/time/minute-clock';
import { StandardMessageDto } from './standard-message-dto';

// The longest pause between two messages from the same sender that still keeps them in one run.
export const runPauseInMilliseconds = 2 * minuteInMilliseconds;
// From this pause on, the history writes the time above the next message.
export const longPauseInMilliseconds = 30 * minuteInMilliseconds;

// What the history shows around one message. A heading above it: with the day (startsDay) for the first
// message of a day in the visitor's time zone, the first one loaded included; with only the time
// (followsLongPause) after a pause of longPauseInMilliseconds. Its time below (showsTime) when it is the
// last message of a run: messages from one sender, each within runPauseInMilliseconds of the one before,
// on the same day, with nothing from the other person between them. A run that is one message under a
// heading has its time there already, so it shows none below.
export type HistoryMark = {
  startsDay: boolean;
  followsLongPause: boolean;
  showsTime: boolean;
};

// The marks of a history, by message id. messages run oldest first, as OpenConversation keeps them.
export function historyMarks(
  messages: readonly StandardMessageDto[],
): ReadonlyMap<number, HistoryMark> {
  const marks = new Map<number, HistoryMark>();

  messages.forEach((message, index) => {
    const previous = messages[index - 1];
    const next = messages[index + 1];
    const startsDay = previous === undefined || !isSameDay(previous, message);
    const followsLongPause =
      !startsDay &&
      previous !== undefined &&
      pauseBetween(previous, message) >= longPauseInMilliseconds;
    // A heading always starts a run: its pause is longer than a run's, or the day changed.
    const hasHeading = startsDay || followsLongPause;
    const continuesRun =
      next !== undefined &&
      next.sender.id === message.sender.id &&
      isSameDay(message, next) &&
      pauseBetween(message, next) <= runPauseInMilliseconds;

    marks.set(message.id, { startsDay, followsLongPause, showsTime: !continuesRun && !hasHeading });
  });

  return marks;
}
function pauseBetween(earlier: StandardMessageDto, later: StandardMessageDto): number {
  return Date.parse(later.sentAt) - Date.parse(earlier.sentAt);
}

function isSameDay(first: StandardMessageDto, second: StandardMessageDto): boolean {
  return new Date(first.sentAt).toDateString() === new Date(second.sentAt).toDateString();
}
