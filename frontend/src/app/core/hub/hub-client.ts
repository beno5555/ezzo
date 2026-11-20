import {
  EnvironmentInjector,
  ErrorHandler,
  Injectable,
  effect,
  inject,
  signal,
} from '@angular/core';
// Types only: the library itself is loaded on demand by SignalRLoader, so it stays out of the first download.
import type { HubConnection, IRetryPolicy, RetryContext } from '@microsoft/signalr';
import { PresenceStore } from '../../features/friendships/presence-store';
import { UnreadStore } from '../../features/messages/unread-store';
import { SessionStore } from '../session/session-store';
import { HubEvent } from './hub-event';
import { SignalRLibrary, SignalRLoader } from './signalr-loader';
import { UserOfflineDto } from './user-offline-dto';
import { UserOnlineDto } from './user-online-dto';

const hubAddress = '/hubs/messages';

// How long to wait before each attempt to connect again; the last delay repeats for as long as it takes.
const retryDelaysMilliseconds = [0, 2_000, 5_000, 10_000, 30_000];

const retryForever: IRetryPolicy = {
  nextRetryDelayInMilliseconds: (retryContext: RetryContext) =>
    retryDelayFor(retryContext.previousRetryCount),
};

// The one owner of the connection to the hub (ADR 0001: same origin, through the dev proxy in development).
// It connects while a user is signed in and maps each server event to one store method. It holds no logic
// of its own: what an event means is the store's business. Events whose store arrives in a later ticket
// (a message for the open conversation, seen, edited, comments, likes, typing) are mapped then.
@Injectable({ providedIn: 'root' })
export class HubClient {
  private readonly injector = inject(EnvironmentInjector);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly sessionStore = inject(SessionStore);
  private readonly presenceStore = inject(PresenceStore);
  private readonly unreadStore = inject(UnreadStore);
  private readonly signalRLoader = inject(SignalRLoader);

  private connection: HubConnection | null = null;
  // Connecting and disconnecting run one after another, in the order the session changed.
  private lastTurn: Promise<void> = Promise.resolve();
  private readonly connectedTimes = signal(0);

  // Counts every connect and reconnect, so a reader can read again what it may have missed meanwhile.
  readonly connectionNumber = this.connectedTimes.asReadonly();

  // Called once at startup: connects on sign-in, disconnects on sign-out, and starts over for another user.
  followSession(): void {
    effect(
      () => {
        this.lastTurn = this.followInTurn(this.lastTurn, this.sessionStore.userId());
      },
      { injector: this.injector },
    );
  }

  // A turn that fails is reported as a bug, and the turns after it still run. A failed load of the library is one.
  private async followInTurn(previousTurn: Promise<void>, userId: number | null): Promise<void> {
    await previousTurn;

    try {
      await this.follow(userId);
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
    }
  }

  private async follow(userId: number | null): Promise<void> {
    await this.disconnect();

    const isSignedIn = userId !== null;
    if (isSignedIn) {
      const library = await this.signalRLoader.load();
      // The session may have changed while the library loaded; the turn queued for that change connects instead.
      const isStillSignedIn = this.sessionStore.userId() === userId;

      if (isStillSignedIn) {
        this.connect(library);
      }
    }
  }

  private connect({ HubConnectionBuilder, LogLevel }: SignalRLibrary): void {
    const connection = new HubConnectionBuilder()
      .withUrl(hubAddress, {
        // Asked on every connect and reconnect, so a connection that outlives its token comes back with a valid one.
        accessTokenFactory: async () => (await this.sessionStore.validAccessToken()) ?? '',
      })
      .withAutomaticReconnect(retryForever)
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on(HubEvent.UserOnline, (payload: UserOnlineDto) => {
      void this.presenceStore.markOnline(payload.userId); // fire-and-forget: the store looks up an unknown friend
    });
    connection.on(HubEvent.UserOffline, (payload: UserOfflineDto) => {
      this.presenceStore.markOffline(payload.userId, payload.lastActiveAt);
    });
    // Until the conversation store arrives (ticket 19), every message counts as one for a closed conversation.
    connection.on(HubEvent.ReceiveMessage, () => {
      void this.unreadStore.refresh(); // fire-and-forget: the store keeps the last count on failure
    });
    connection.onreconnected(() => {
      this.connected();
    });

    this.connection = connection;
    void this.keepStarting(connection, 0); // fire-and-forget: retries until connected or no longer wanted
  }

  // The automatic reconnect covers a connection that drops, not a first start that fails,
  // so the first start is retried here, until it succeeds or the connection is no longer wanted.
  private async keepStarting(connection: HubConnection, failedAttempts: number): Promise<void> {
    const isWanted = this.connection === connection;

    if (isWanted) {
      const isStarted = await startOnce(connection);
      const isStillWanted = this.connection === connection;

      if (isStarted && isStillWanted) {
        this.connected();
      } else if (!isStarted) {
        await waitFor(retryDelayFor(failedAttempts + 1));
        await this.keepStarting(connection, failedAttempts + 1);
      }
    }
  }

  // Messages may have arrived while the connection was down.
  private connected(): void {
    this.connectedTimes.update((times) => times + 1);
    void this.unreadStore.refresh(); // fire-and-forget: the store keeps the last count on failure
  }

  private async disconnect(): Promise<void> {
    const connection = this.connection;
    this.connection = null;

    if (connection !== null) {
      await connection.stop();
      this.presenceStore.clear();
      this.unreadStore.clear();
    }
  }
}

// Resolves to whether the connection started. A failure here is expected (offline, the backend restarting).
async function startOnce(connection: HubConnection): Promise<boolean> {
  let isStarted: boolean;

  try {
    await connection.start();
    isStarted = true;
  } catch {
    isStarted = false;
  }

  return isStarted;
}

function retryDelayFor(previousAttempts: number): number {
  const lastDelayIndex = retryDelaysMilliseconds.length - 1;

  return retryDelaysMilliseconds[Math.min(previousAttempts, lastDelayIndex)];
}

function waitFor(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
