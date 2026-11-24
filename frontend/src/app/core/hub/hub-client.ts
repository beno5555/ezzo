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
import { NotifyCommentDto } from '../../features/comments/notify-comment-dto';
import { PresenceStore } from '../../features/friendships/presence-store';
import { ConversationsStore } from '../../features/messages/conversations-store';
import { MessageDeletedDto } from '../../features/messages/message-deleted-dto';
import { MessageEditedDto } from '../../features/messages/message-edited-dto';
import { MessageSeenDto } from '../../features/messages/message-seen-dto';
import { PushMessageDto } from '../../features/messages/push-message-dto';
import { TypingStore } from '../../features/messages/typing-store';
import { UnreadStore } from '../../features/messages/unread-store';
import { UserTypingDto } from '../../features/messages/user-typing-dto';
import { LiveToastStore } from './live-toast-store';
import { PostLikedDto } from '../../features/posts/post-liked-dto';
import { SessionStore } from '../session/session-store';
import { HubEvent } from './hub-event';
import { HubMethod } from './hub-method';
import { SignalRLibrary } from './signalr-library';
import { SignalRLoader } from './signalr-loader';
import { UserOfflineDto } from './user-offline-dto';
import { UserOnlineDto } from './user-online-dto';

const hubAddress = '/hubs/messages';

// How long to wait before each attempt to connect again; the last delay repeats for as long as it takes.
const retryDelaysMilliseconds = [0, 2_000, 5_000, 10_000, 30_000];

// How often a failed load of the SignalR library is tried again before it is reported, unlike a connection,
// which retries forever: a load that fails several times running (a chunk replaced by a deploy) will not recover.
const libraryLoadRetries = 3;

const retryForever: IRetryPolicy = {
  nextRetryDelayInMilliseconds: (retryContext: RetryContext) =>
    retryDelayFor(retryContext.previousRetryCount),
};

// The one owner of the connection to the hub (ADR 0001: same origin, through the dev proxy in development).
// It connects while a user is signed in and maps each server event to the store methods that take it. It
// decides nothing about what an event means: that is the stores' business (what becomes a toast:
// LiveToastStore). Only the order of two calls is its own: ReceiveMessage reaches LiveToastStore before
// ConversationsStore, which still knows which conversation was open, and UserOnline reaches it once
// PresenceStore has the friend's name. The one call to the hub, SendTyping, goes through sendTyping, so no
// store or component touches the connection.
@Injectable({ providedIn: 'root' })
export class HubClient {
  private readonly injector = inject(EnvironmentInjector);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly sessionStore = inject(SessionStore);
  private readonly presenceStore = inject(PresenceStore);
  private readonly unreadStore = inject(UnreadStore);
  private readonly conversationsStore = inject(ConversationsStore);
  private readonly typingStore = inject(TypingStore);
  private readonly liveToastStore = inject(LiveToastStore);
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

  // Calls SendTyping for the friend. A call while the connection is down or reconnecting is lost, which is
  // expected and harmless: the friend only sees "typing…" a little late.
  async sendTyping(friendId: number): Promise<void> {
    const connection = this.connection;

    if (connection !== null) {
      try {
        await connection.invoke(HubMethod.SendTyping, friendId);
      } catch {
        // Typing is best effort; the next keystroke tries again.
      }
    }
  }

  // A turn that fails is reported as a bug, and the turns after it still run.
  // A load of the SignalR library that still fails after its retries fails its turn this way.
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
      const library = await this.loadLibraryFor(userId, 0);
      // The session may have changed while the library loaded; the turn queued for that change connects instead.
      const isStillSignedIn = this.sessionStore.userId() === userId;

      if (library !== null && isStillSignedIn) {
        this.connect(library);
      }
    }
  }

  // Resolves to the library, or to null once the user has signed out. A failed load is tried again a few
  // times on the connection's delays (a brief outage while signing in); after the last retry it throws.
  private async loadLibraryFor(
    userId: number,
    failedAttempts: number,
  ): Promise<SignalRLibrary | null> {
    let library: SignalRLibrary | null = null;
    const isWanted = this.sessionStore.userId() === userId;

    if (isWanted) {
      try {
        library = await this.signalRLoader.load();
      } catch (error: unknown) {
        const canRetry = failedAttempts < libraryLoadRetries;
        if (canRetry) {
          await waitFor(retryDelayFor(failedAttempts + 1));
          library = await this.loadLibraryFor(userId, failedAttempts + 1);
        } else {
          throw error;
        }
      }
    }

    return library;
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
      void this.friendCameOnline(payload.userId); // fire-and-forget: the toast waits for an unknown friend's name
    });
    connection.on(HubEvent.UserOffline, (payload: UserOfflineDto) => {
      this.presenceStore.markOffline(payload.userId, payload.lastActiveAt);
    });
    connection.on(HubEvent.ReceiveMessage, (payload: PushMessageDto) => {
      // First, while the store still knows which conversation was open when the message arrived.
      this.liveToastStore.messageReceived(payload);
      void this.conversationsStore.receive(payload); // fire-and-forget: the store shows the message at once
    });
    connection.on(HubEvent.ReceiveComment, (payload: NotifyCommentDto) => {
      this.liveToastStore.commentReceived(payload);
    });
    connection.on(HubEvent.PostLiked, (payload: PostLikedDto) => {
      this.liveToastStore.postLiked(payload);
    });
    connection.on(HubEvent.MessageSeen, (payload: MessageSeenDto) => {
      this.conversationsStore.markSeen(payload);
    });
    connection.on(HubEvent.MessageEdited, (payload: MessageEditedDto) => {
      void this.conversationsStore.markEdited(payload); // fire-and-forget: the store shows the new text
    });
    connection.on(HubEvent.MessageDeleted, (payload: MessageDeletedDto) => {
      void this.conversationsStore.markDeleted(payload); // fire-and-forget: the store drops the message
    });
    connection.on(HubEvent.UserTyping, (payload: UserTypingDto) => {
      this.typingStore.userTyping(payload);
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

  // The presence store marks the friend online, looking up their name when it has none; the toast needs it.
  private async friendCameOnline(userId: number): Promise<void> {
    await this.presenceStore.markOnline(userId);
    this.liveToastStore.friendOnline(userId);
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
      this.conversationsStore.clear();
      this.typingStore.clear();
      this.liveToastStore.clear();
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
