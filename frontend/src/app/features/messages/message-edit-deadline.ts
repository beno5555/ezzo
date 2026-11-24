import { LIMITS } from '../../core/limits';

// The moment the 20 minutes in which a message may be edited run out, in milliseconds since 1970: the
// backend (MessageService.EditMessage) counts from the time it stored the message. The message item offers
// Edit until then (beforeDeadline).
export function messageEditDeadline(message: { sentAt: string }): number {
  return Date.parse(message.sentAt) + LIMITS.messages.editWindowMilliseconds;
}
