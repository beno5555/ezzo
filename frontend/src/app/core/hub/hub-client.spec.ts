import { ErrorHandler, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { IHttpConnectionOptions } from '@microsoft/signalr';
import { PresenceStore } from '../../features/friendships/presence-store';
import { UnreadStore } from '../../features/messages/unread-store';
import { SessionStore } from '../session/session-store';
import { waitForPendingWork } from '../session/testing/wait-for-pending-work';
import { HubClient } from './hub-client';
import { SignalRLibrary } from './signalr-library';
import { SignalRLoader } from './signalr-loader';

// Stands in for a real connection: it starts at once and records whether it was stopped.
class FakeConnection {
  isStarted = false;
  isStopped = false;

  constructor(readonly options: IHttpConnectionOptions) {}

  on(): void {
    // These tests send no server events.
  }

  onreconnected(): void {
    // These tests never drop a connection.
  }

  start(): Promise<void> {
    this.isStarted = true;

    return Promise.resolve();
  }

  stop(): Promise<void> {
    this.isStopped = true;

    return Promise.resolve();
  }
}

describe('HubClient', () => {
  const userId = signal<number | null>(null);
  let connections: FakeConnection[];
  let finishLoading: (library: SignalRLibrary) => void;
  let failLoading: (error: Error) => void;
  let loads: number;
  let handleError: ReturnType<typeof vi.fn>;
  let hubClient: HubClient;

  // Every builder made through the fake library adds the connection it builds to `connections`.
  function fakeLibrary(): SignalRLibrary {
    class FakeBuilder {
      private options: IHttpConnectionOptions = {};

      withUrl(_url: string, options: IHttpConnectionOptions): this {
        this.options = options;

        return this;
      }

      withAutomaticReconnect(): this {
        return this;
      }

      configureLogging(): this {
        return this;
      }

      build(): FakeConnection {
        const connection = new FakeConnection(this.options);
        connections.push(connection);

        return connection;
      }
    }

    return {
      HubConnectionBuilder: FakeBuilder,
      LogLevel: { Warning: 'fake warning level' }, // the fake builder ignores the level
    } as unknown as SignalRLibrary;
  }

  function signIn(id: number | null): void {
    userId.set(id);
    TestBed.tick();
  }

  beforeEach(() => {
    userId.set(null);
    connections = [];
    loads = 0;
    handleError = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        {
          provide: SessionStore,
          useValue: {
            userId,
            validAccessToken: () => Promise.resolve(`token-of-${String(userId())}`),
          },
        },
        { provide: PresenceStore, useValue: { clear: vi.fn() } },
        { provide: UnreadStore, useValue: { clear: vi.fn(), refresh: vi.fn() } },
        { provide: ErrorHandler, useValue: { handleError } },
        {
          provide: SignalRLoader,
          useValue: {
            load: () => {
              loads += 1;

              return new Promise<SignalRLibrary>((resolve, reject) => {
                finishLoading = resolve;
                failLoading = reject;
              });
            },
          },
        },
      ],
    });
    hubClient = TestBed.inject(HubClient);
    hubClient.followSession();
  });

  it('loads nothing while nobody is signed in', async () => {
    TestBed.tick();
    await waitForPendingWork();

    expect(loads).toBe(0);
    expect(connections).toHaveLength(0);
  });

  it('loads the library and connects when a user signs in', async () => {
    signIn(7);
    await waitForPendingWork();
    finishLoading(fakeLibrary());
    await waitForPendingWork();

    expect(connections).toHaveLength(1);
    expect(connections[0].isStarted).toBe(true);
    expect(hubClient.connectionNumber()).toBe(1);
  });

  it('disconnects when the user signs out', async () => {
    signIn(7);
    await waitForPendingWork();
    finishLoading(fakeLibrary());
    await waitForPendingWork();

    signIn(null);
    await waitForPendingWork();

    expect(connections[0].isStopped).toBe(true);
  });

  it('opens no connection for a user who signs out while the library loads', async () => {
    signIn(7);
    await waitForPendingWork();
    signIn(null);
    await waitForPendingWork();
    finishLoading(fakeLibrary());
    await waitForPendingWork();

    expect(connections).toHaveLength(0);
  });

  it('connects only as the user who signed in while the library loaded for another', async () => {
    signIn(7);
    await waitForPendingWork();
    signIn(null);
    signIn(8);
    await waitForPendingWork();
    finishLoading(fakeLibrary());
    await waitForPendingWork();
    // The second turn asks for the library again; the browser hands back the module it already fetched.
    finishLoading(fakeLibrary());
    await waitForPendingWork();

    expect(connections).toHaveLength(1);
    expect(await connections[0].options.accessTokenFactory?.()).toBe('token-of-8');
  });

  it('reports a failed load and opens no connection', async () => {
    const loadError = new Error('The chunk could not be fetched');

    signIn(7);
    await waitForPendingWork();
    failLoading(loadError);
    await waitForPendingWork();

    expect(handleError).toHaveBeenCalledWith(loadError);
    expect(connections).toHaveLength(0);
  });

  it('connects on the next sign-in after a failed load', async () => {
    signIn(7);
    await waitForPendingWork();
    failLoading(new Error('The chunk could not be fetched'));
    await waitForPendingWork();

    signIn(null);
    signIn(8);
    await waitForPendingWork();
    finishLoading(fakeLibrary());
    await waitForPendingWork();

    expect(connections).toHaveLength(1);
    expect(connections[0].isStarted).toBe(true);
  });
});
