// The events the server pushes on /hubs/messages, as named in "Hub events" in docs/backend/signalr.md.
export const HubEvent = {
  ReceiveMessage: 'ReceiveMessage',
  MessageSeen: 'MessageSeen',
  MessageEdited: 'MessageEdited',
  ReceiveComment: 'ReceiveComment',
  PostLiked: 'PostLiked',
  UserOnline: 'UserOnline',
  UserOffline: 'UserOffline',
  UserTyping: 'UserTyping',
} as const;
export type HubEvent = (typeof HubEvent)[keyof typeof HubEvent];
