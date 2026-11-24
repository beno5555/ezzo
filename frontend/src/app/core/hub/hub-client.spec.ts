import { ErrorHandler, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { IHttpConnectionOptions } from '@microsoft/signalr';
import { PresenceStore } from '../../features/friendships/presence-store';
import { ConversationsStore } from '../../features/messages/conversations-store';
import { LiveToastStore } from './live-toast-store';
import { TypingStore } from '../../features/messages/typing-store';
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
  // What the client has called on the hub, as [method, ...arguments].
  readonly invocations: unknown[][] = [];
  // Set to make the next call fail, as a call does while the connection is down.
  invokeError: Error | null = null;
  private readonly handlers = new Map<string, (payload: unknown) => void>();

  constructor(readonly options: IHttpConnectionOptions) {}

  on(event: string, handler: (payload: unknown) => void): void {
    this.handlers.set(event, handler);
  }

  // Plays a server push to the client.
  push(event: string, payload: unknown): void {
    this.handlers.get(event)?.(payload);
  }

  invoke(method: string, ...args: unknown[]): Promise<void> {
    this.invocations.push([method, ...args]);

    return this.invokeError === null ? Promise.resolve() : Promise.reject(this.invokeError);
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
        {
          provide: PresenceStore,
          useValue: { clear: vi.fn(), markOnline: vi.fn().mockResolvedValue(undefined) },
        },
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

  describe('typing, edits and toasts', () => {
    async function connect(): Promise<FakeConnection> {
      signIn(7);
      await waitForPendingWork();
      finishLoading(fakeLibrary());
      await waitForPendingWork();

      return connections[0];
    }

    it('calls SendTyping on the hub with the friend’s id', async () => {
      const connection = await connect();

      await hubClient.sendTyping(3);

      expect(connection.invocations).toEqual([['SendTyping', 3]]);
    });

    it('calls nothing while there is no connection', async () => {
      await hubClient.sendTyping(3);

      expect(connections).toHaveLength(0);
    });

    it('lets a SendTyping that fails pass, as one does while the connection is down', async () => {
      const connection = await connect();
      connection.invokeError = new Error('The connection is not in the Connected state');

      await expect(hubClient.sendTyping(3)).resolves.toBeUndefined();
      expect(handleError).not.toHaveBeenCalled();
    });

    it('shows a friend as typing on UserTyping', async () => {
      const connection = await connect();
      const typingStore = TestBed.inject(TypingStore);

      connection.push('UserTyping', { userId: 3 });

      expect(typingStore.isTyping(3)).toBe(true);
      typingStore.clear();
    });

    it('hands MessageEdited to the conversations', async () => {
      const connection = await connect();
      const markEdited = vi
        .spyOn(TestBed.inject(ConversationsStore), 'markEdited')
        .mockResolvedValue(undefined);

      connection.push('MessageEdited', { id: 12, content: 'Fixed' });

      expect(markEdited).toHaveBeenCalledExactlyOnceWith({ id: 12, content: 'Fixed' });
    });

    it('hands MessageDeleted to the conversations', async () => {
      const connection = await connect();
      const markDeleted = vi
        .spyOn(TestBed.inject(ConversationsStore), 'markDeleted')
        .mockResolvedValue(undefined);

      connection.push('MessageDeleted', { id: 12 });

      expect(markDeleted).toHaveBeenCalledExactlyOnceWith({ id: 12 });
    });

    it('hands ReceiveMessage to the live toasts as well as the conversations', async () => {
      const connection = await connect();
      const toasts = vi
        .spyOn(TestBed.inject(LiveToastStore), 'messageReceived')
        .mockReturnValue(undefined);
      const receive = vi
        .spyOn(TestBed.inject(ConversationsStore), 'receive')
        .mockResolvedValue(undefined);
      const payload = { id: 1, content: 'Hi', images: [], sender: { id: 3, username: 'alice' } };

      connection.push('ReceiveMessage', payload);

      expect(toasts).toHaveBeenCalledExactlyOnceWith(payload);
      expect(receive).toHaveBeenCalledExactlyOnceWith(payload);
    });

    it('hands ReceiveComment to the live toasts', async () => {
      const connection = await connect();
      const commentReceived = vi
        .spyOn(TestBed.inject(LiveToastStore), 'commentReceived')
        .mockReturnValue(undefined);
      const payload = { id: 5, authorUsername: 'bob', content: 'Nice', postId: 12 };

      connection.push('ReceiveComment', payload);

      expect(commentReceived).toHaveBeenCalledExactlyOnceWith(payload);
    });

    it('hands PostLiked to the live toasts', async () => {
      const connection = await connect();
      const postLiked = vi
        .spyOn(TestBed.inject(LiveToastStore), 'postLiked')
        .mockReturnValue(undefined);
      const payload = { postId: 12, likedBy: { id: 4, username: 'bob' }, likeCount: 3 };

      connection.push('PostLiked', payload);

      expect(postLiked).toHaveBeenCalledExactlyOnceWith(payload);
    });

    it('asks for an online toast once the presence store has marked the friend online', async () => {
      const connection = await connect();
      const order: string[] = [];
      vi.mocked(TestBed.inject(PresenceStore).markOnline).mockImplementation(() => {
        order.push('marked online');

        return Promise.resolve();
      });
      const friendOnline = vi
        .spyOn(TestBed.inject(LiveToastStore), 'friendOnline')
        .mockImplementation(() => {
          order.push('toast');
        });

      connection.push('UserOnline', { userId: 3 });
      await waitForPendingWork();

      expect(order).toEqual(['marked online', 'toast']);
      expect(friendOnline).toHaveBeenCalledExactlyOnceWith(3);
    });
  });

  describe('when the load fails', () => {
    const loadError = new Error('The chunk could not be fetched');
    // The waits before the three retries: 2, 5 and 10 seconds.
    const retryWaitsMilliseconds = [2_000, 5_000, 10_000];

    // Lets the turn run up to its next load or wait, then the wait run out.
    async function waitMilliseconds(milliseconds: number): Promise<void> {
      await vi.advanceTimersByTimeAsync(milliseconds);
    }

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('tries again after a wait and connects', async () => {
      signIn(7);
      await waitMilliseconds(0);
      failLoading(loadError);
      await waitMilliseconds(retryWaitsMilliseconds[0]);
      finishLoading(fakeLibrary());
      await waitMilliseconds(0);

      expect(loads).toBe(2);
      expect(connections).toHaveLength(1);
      expect(handleError).not.toHaveBeenCalled();
    });

    it('reports the failure once three retries have failed, and opens no connection', async () => {
      signIn(7);
      await waitMilliseconds(0);
      failLoading(loadError);
      for (const wait of retryWaitsMilliseconds) {
        await waitMilliseconds(wait);
        failLoading(loadError);
      }
      await waitMilliseconds(0);

      expect(loads).toBe(4);
      expect(handleError).toHaveBeenCalledExactlyOnceWith(loadError);
      expect(connections).toHaveLength(0);
    });

    it('stops trying for a user who signs out', async () => {
      signIn(7);
      await waitMilliseconds(0);
      failLoading(loadError);
      await waitMilliseconds(0);
      signIn(null);
      await waitMilliseconds(retryWaitsMilliseconds[0]);

      expect(loads).toBe(1);
      expect(handleError).not.toHaveBeenCalled();
    });

    it('connects as the user who signed in while it waited to try again', async () => {
      signIn(7);
      await waitMilliseconds(0);
      failLoading(loadError);
      await waitMilliseconds(0);
      signIn(null);
      signIn(8);
      await waitMilliseconds(retryWaitsMilliseconds[0]);
      finishLoading(fakeLibrary());
      await waitMilliseconds(0);

      expect(loads).toBe(2);
      expect(connections).toHaveLength(1);
      expect(await connections[0].options.accessTokenFactory?.()).toBe('token-of-8');
    });
  });
});
