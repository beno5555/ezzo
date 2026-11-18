import { Component, effect, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { HubClient } from './core/hub/hub-client';
import { LanguageStore } from './core/languages/language-store';
import { LanguageSwitch } from './core/languages/language-switch/language-switch';
import { LIMITS } from './core/limits';
import { appAddresses } from './core/routing/app-addresses';
import { SessionStore } from './core/session/session-store';
import { ThemeSwitch } from './core/themes/theme-switch/theme-switch';
import { PresenceStore } from './features/friendships/presence-store';
import { MessageApi } from './features/messages/message-api';
import { UnreadStore } from './features/messages/unread-store';
import { Button } from './shared/button/button';

@Component({
  imports: [RouterLink, RouterOutlet, LanguageSwitch, ThemeSwitch, Button],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  private readonly sessionStore = inject(SessionStore);
  private readonly messageApi = inject(MessageApi);
  private readonly presenceStore = inject(PresenceStore);
  private readonly hubClient = inject(HubClient);

  protected readonly text = inject(LanguageStore).text;
  protected readonly user = this.sessionStore.user;
  protected readonly signInAddress = appAddresses.signIn;
  protected readonly unreadCount = inject(UnreadStore).count;
  protected readonly onlineFriends = this.presenceStore.onlineFriends;

  constructor() {
    effect(() => {
      const userId = this.sessionStore.userId();
      const isConnected = this.hubClient.connectionNumber() > 0;
      if (userId !== null && isConnected) {
        void this.loadFriends(userId); // fire-and-forget: the bare page shows no failure
      }
    });
  }

  async signOut(): Promise<void> {
    await this.sessionStore.signOut();
    await this.router.navigateByUrl(appAddresses.home);
  }

  // The bare live summary's presence: the first page of both chat lists, whose friend rows carry it, read on
  // every connect, since a reconnect may have missed events. Ticket 07's shell removes this, and the
  // conversation store (ticket 18) feeds presence from the chat lists.
  private async loadFriends(userId: number): Promise<void> {
    const query = {
      pageNumber: LIMITS.paging.firstPageNumber,
      pageSize: LIMITS.paging.maxPageSize,
    };
    const askedAt = Date.now();
    const [withConversation, withoutConversation] = await Promise.all([
      this.messageApi.getConversationFriends(query),
      this.messageApi.getNonConversationFriends(query),
    ]);

    const isSameUser = this.sessionStore.userId() === userId;
    if (isSameUser) {
      const rows = [
        ...(withConversation.succeeded
          ? withConversation.data.map((row) => row.conversationFriend)
          : []),
        ...(withoutConversation.succeeded ? withoutConversation.data : []),
      ];
      this.presenceStore.track(rows, askedAt);
    }
  }
}
