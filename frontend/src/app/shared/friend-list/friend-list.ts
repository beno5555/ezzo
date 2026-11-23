import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideMessageCircle, LucideUsers } from '@lucide/angular';
import { LanguageStore } from '../../core/languages/language-store';
import { PageLoadStatus } from '../../core/paging/page-load-status';
import { PagedList } from '../../core/paging/paged-list';
import { appAddresses } from '../../core/routing/app-addresses';
import { Avatar } from '../avatar/avatar';
import { Button } from '../button/button';
import { ButtonLook } from '../button/button-look';
import { DeletingNotice } from '../deleting-notice/deleting-notice';
import { EmptyState } from '../empty-state/empty-state';
import { FadeOut } from '../fade-out/fade-out';
import { LoadFailure } from '../load-failure/load-failure';
import { ScrollSentinel } from '../scroll-sentinel/scroll-sentinel';
import { FriendListTexts } from './friend-list-texts';
import { FriendshipAction } from '../../features/friendships/friendship-action';
import { friendshipActionLooks } from '../../features/friendships/friendship-action-looks';
import { friendshipKey } from '../../features/friendships/friendship-key';
import { StandardFriendshipDto } from '../../features/friendships/standard-friendship-dto';

// A paged list of people, shared by the friends page (its three tabs) and a profile's Friends tab: the rows
// (an avatar and the name, a link to the person's profile), and below them what the list is doing: loading,
// failed with a way to try again, or empty. Nothing marks the end of a list that has rows. The owner of the
// list decides what a click does; this only shows it and reports it:
//   <app-friend-list [list]="store.list(FriendsTab.Incoming)" [texts]="…" [retryLabel]="…"
//     [actions]="[FriendshipAction.Accept, FriendshipAction.Decline]"
//     (action)="perform($event.action, $event.friendship)" (more)="loadMore()" />
// Each row offers the buttons in actions, and a Message button that leads to the conversation when
// canMessage is on (only for the user's own friends). A row whose id is in waitingIds says "Deleting…" in
// place of its buttons, and one in fadingIds fades out (DeleteFade). A person whose account is deactivated
// or deleted comes without an id and under a placeholder name: a row of plain text, with no link and no
// buttons, since every call needs the id.
@Component({
  selector: 'app-friend-list',
  imports: [
    Avatar,
    Button,
    DeletingNotice,
    EmptyState,
    FadeOut,
    LoadFailure,
    RouterLink,
    ScrollSentinel,
    LucideMessageCircle,
    LucideUsers,
  ],
  templateUrl: './friend-list.html',
  styleUrl: './friend-list.css',
})
export class FriendList {
  readonly list = input.required<PagedList<StandardFriendshipDto>>();
  readonly texts = input.required<FriendListTexts>();
  readonly retryLabel = input.required<string>();
  readonly actions = input<readonly FriendshipAction[]>([]);
  readonly canMessage = input(false);
  readonly waitingIds = input<ReadonlySet<number>>(new Set());
  readonly fadingIds = input<ReadonlySet<number>>(new Set());

  // A click on a row's button.
  readonly action = output<{ action: FriendshipAction; friendship: StandardFriendshipDto }>();
  // The scroll sentinel was reached, or Try again was pressed.
  readonly more = output<void>();

  protected readonly text = inject(LanguageStore).text;
  protected readonly PageLoadStatus = PageLoadStatus;
  protected readonly profileAddress = appAddresses.profile;
  protected readonly conversationAddress = appAddresses.conversation;
  // Remove is on every row, so it has no edge: a column of red boxes would shout (owner, 2026-11-23).
  protected readonly lookOf = (action: FriendshipAction): ButtonLook =>
    action === FriendshipAction.Remove ? ButtonLook.DangerText : friendshipActionLooks[action];
  protected readonly keyOf = friendshipKey;

  protected readonly hasRows = computed(() => this.list().items().length > 0);

  protected isWaiting(friendship: StandardFriendshipDto): boolean {
    const id = friendship.otherUser.id;

    return id !== null && this.waitingIds().has(id);
  }

  protected isFading(friendship: StandardFriendshipDto): boolean {
    const id = friendship.otherUser.id;

    return id !== null && this.fadingIds().has(id);
  }

  protected messageLabel(username: string): string {
    return this.text().friendships.page.rowActionLabel(
      this.text().friendships.page.messageButton,
      username,
    );
  }

  // The words on a row's button. Remove is short here (the profile's button says "Remove friend").
  protected actionText(action: FriendshipAction): string {
    const labels = this.text().friendships;

    return action === FriendshipAction.Remove ? labels.page.removeButton : labels.actions[action];
  }

  protected actionLabel(action: FriendshipAction, username: string): string {
    return this.text().friendships.page.rowActionLabel(
      this.text().friendships.actions[action],
      username,
    );
  }
}
