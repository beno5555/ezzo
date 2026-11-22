import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  untracked,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideArrowLeft,
  LucideMessageCircleDashed,
  LucideUserRoundX,
  LucideUserX,
} from '@lucide/angular';
import { DateFormatter } from '../../../core/languages/date-formatter';
import { LanguageStore } from '../../../core/languages/language-store';
import { PageLoadStatus } from '../../../core/paging/page-load-status';
import { appAddresses } from '../../../core/routing/app-addresses';
import { SessionStore } from '../../../core/session/session-store';
import { Avatar } from '../../../shared/avatar/avatar';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { LoadFailure } from '../../../shared/load-failure/load-failure';
import { PresenceLabel } from '../../../shared/presence-label/presence-label';
import { ScrollSentinel } from '../../../shared/scroll-sentinel/scroll-sentinel';
import { SentinelSide } from '../../../shared/scroll-sentinel/sentinel-side';
import { TextLink } from '../../../shared/text-link/text-link';
import { ConversationOpenStatus } from '../conversation-open-status';
import { ConversationsStore } from '../conversations-store';
import { MessageForm } from '../message-form/message-form';
import { MessageItem } from '../message-item/message-item';
import { NewMessage } from '../new-message';
import { TypingStore } from '../typing-store';
import { historyMarks } from '../history-marks';

// The conversation at /messages/:username, inside MessagesPage. ConversationsStore finds the friend by the
// username, loads the newest page of the history and marks the conversation read; older pages load as the
// reader scrolls up. A username that is nobody's, or not a friend's, gets a state that says so.
//
// The history scrolls in a box whose direction is reversed (flex-col-reverse around one wrapper), so it
// opens at the newest message and an older page added on top does not move what the reader is looking at.
// The messages inside the wrapper stay in reading order for screen readers. The same box follows new
// messages while the reader is at the newest one, and leaves a reader of older messages where they are.
// The message box (MessageForm) sits under the history.
@Component({
  selector: 'app-conversation-page',
  imports: [
    RouterLink,
    Avatar,
    EmptyState,
    LoadFailure,
    MessageForm,
    MessageItem,
    PresenceLabel,
    ScrollSentinel,
    TextLink,
    LucideArrowLeft,
    LucideMessageCircleDashed,
    LucideUserRoundX,
    LucideUserX,
  ],
  templateUrl: './conversation-page.html',
  styleUrl: './conversation-page.css',
  host: { class: 'flex min-h-0 flex-1 flex-col' },
})
export class ConversationPage {
  private readonly conversationsStore = inject(ConversationsStore);
  private readonly typingStore = inject(TypingStore);

  // The :username segment of the address.
  readonly username = input.required<string>();

  protected readonly text = inject(LanguageStore).text;
  protected readonly signedInUserId = inject(SessionStore).userId;
  protected readonly dateFormatter = inject(DateFormatter);
  protected readonly PageLoadStatus = PageLoadStatus;
  protected readonly ConversationOpenStatus = ConversationOpenStatus;
  protected readonly SentinelSide = SentinelSide;
  protected readonly listAddress = appAddresses.messages;
  // The store's conversation once it is the one in the address; until then the page shows it opening.
  protected readonly conversation = computed(() => {
    const opened = this.conversationsStore.openConversation();

    return opened !== null && opened.username === this.username() ? opened : null;
  });
  protected readonly friend = computed(() => this.conversation()?.friend ?? null);
  // The friend is writing to the user (TypingStore): "typing…" shows under their name.
  protected readonly isFriendTyping = computed(() => {
    const friendId = this.friend()?.id ?? null;

    return friendId !== null && this.typingStore.isTyping(friendId);
  });
  protected readonly status = computed(
    () => this.conversation()?.status ?? ConversationOpenStatus.Loading,
  );
  protected readonly hasMessages = computed(() => (this.conversation()?.messages.length ?? 0) > 0);
  // Where the history writes a day or a time (historyMarks).
  protected readonly marks = computed(() => historyMarks(this.conversation()?.messages ?? []));
  protected readonly profileAddress = computed(() =>
    appAddresses.profile(this.friend()?.username ?? this.username()),
  );
  // The user's last message that the friend has read, which says "Seen" below.
  protected readonly lastSeenOwnId = computed(() => {
    const userId = this.signedInUserId();
    const lastSeen = this.conversation()
      ?.messages.filter((message) => message.sender.id === userId && message.seen)
      .at(-1);

    return lastSeen?.id ?? null;
  });
  private readonly history = viewChild<ElementRef<HTMLElement>>('history');

  constructor() {
    // The page stays while the user moves from one conversation to another, so it opens each username
    // the address gives it.
    effect(() => {
      const username = this.username();
      untracked(() => {
        void this.conversationsStore.open(username); // fire-and-forget: the store shows how it went
      });
    });
    inject(DestroyRef).onDestroy(() => this.conversationsStore.close());
  }

  // The Try again button after a failed lookup.
  async retryOpen(): Promise<void> {
    await this.conversationsStore.open(this.username());
  }

  // The message box. The user's own message brings the history back to the newest message, even from
  // older ones; in the reversed box the newest end is where scrolling starts, 0.
  async send(newMessage: NewMessage): Promise<void> {
    this.history()?.nativeElement.scrollTo({ top: 0 });
    await this.conversationsStore.send(newMessage);
  }

  // From the sentinel above the messages, and from the Try again button after a failed page.
  async loadOlder(): Promise<void> {
    await this.conversationsStore.loadOlderMessages();
  }
}
