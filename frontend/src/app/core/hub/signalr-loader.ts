import { Injectable } from '@angular/core';

// The parts of the SignalR client the hub client uses.
export type SignalRLibrary = Pick<
  typeof import('@microsoft/signalr'),
  'HubConnectionBuilder' | 'LogLevel'
>;

// Fetches the SignalR client on demand, so it stays out of the first download and a guest never downloads it.
// The browser fetches it once; every later load resolves to the same module.
@Injectable({ providedIn: 'root' })
export class SignalRLoader {
  load(): Promise<SignalRLibrary> {
    return import('@microsoft/signalr');
  }
}
