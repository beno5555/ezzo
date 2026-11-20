// The parts of the SignalR client the hub client uses.
export type SignalRLibrary = Pick<
  typeof import('@microsoft/signalr'),
  'HubConnectionBuilder' | 'LogLevel'
>;
