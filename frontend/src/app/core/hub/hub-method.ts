// The methods the client calls on the hub, as named in "Hub methods" in docs/backend/signalr.md.
export const HubMethod = {
  SendTyping: 'SendTyping',
} as const;
export type HubMethod = (typeof HubMethod)[keyof typeof HubMethod];
