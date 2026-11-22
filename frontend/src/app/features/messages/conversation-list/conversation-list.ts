import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideImage, LucideMessageCircleDashed } from '@lucide/angular';
import { DateFormatter } from '../../../core/languages/date-formatter';
import { LanguageStore } from '../../../core/languages/language-store';
import { PageLoadStatus } from '../../../core/paging/page-load-status';
import { SessionStore } from '../../../core/session/session-store';
import { CountBadge } from '../../../core/shell/count-badge/count-badge';
import { Avatar } from '../../../shared/avatar/avatar';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { LoadFailure } from '../../../shared/load-failure/load-failure';
import { PresenceDot } from '../../../shared/presence-dot/presence-dot';
import { ScrollSentinel } from '../../../shared/scroll-sentinel/scroll-sentinel';
import { toConversationRow } from '../conversation-row';
import { ConversationListStore } from '../conversation-list-store';

// The conversation list, in its own scrolling box: each friend with their presence, the last message and
// its time, and how many messages are unread. The open conversation's row is marked. MessagesPage loads
// the first page; the list loads the next ones as the reader scrolls, like the feed.
@Component({
  selector: 'app-conversation-list',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    RouterLinkActive,
    Avatar,
    CountBadge,
    EmptyState,
    LoadFailure,
    PresenceDot,
    ScrollSentinel,
    LucideImage,
    LucideMessageCircleDashed,
  ],
  templateUrl: './conversation-list.html',
  styleUrl: './conversation-list.css',
})
export class ConversationList {
  private readonly conversationListStore = inject(ConversationListStore);
  private readonly sessionStore = inject(SessionStore);

  protected readonly text = inject(LanguageStore).text;
  protected readonly dateFormatter = inject(DateFormatter);
  protected readonly PageLoadStatus = PageLoadStatus;
  protected readonly status = this.conversationListStore.status;
  protected readonly failureMessage = this.conversationListStore.failure;
  protected readonly rows = computed(() =>
    this.conversationListStore
      .conversations()
      .map((row) => toConversationRow(row, this.sessionStore.userId(), this.text().messages.list)),
  );
  protected readonly hasRows = computed(() => this.rows().length > 0);

  // From the scroll sentinel, and from the Try again button after a failed page.
  async loadMore(): Promise<void> {
    await this.conversationListStore.loadMore();
  }
}
