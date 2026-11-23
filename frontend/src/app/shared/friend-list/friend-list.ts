import { Component, computed, input, output } from '@angular/core';
import { LucideUsers } from '@lucide/angular';
import { PageLoadStatus } from '../../core/paging/page-load-status';
import { PagedList } from '../../core/paging/paged-list';
import { EmptyState } from '../empty-state/empty-state';
import { LoadFailure } from '../load-failure/load-failure';
import { ScrollSentinel } from '../scroll-sentinel/scroll-sentinel';
import { UserRow } from '../user-row/user-row';
import { FriendListTexts } from './friend-list-texts';
import { FriendshipAction } from '../../features/friendships/friendship-action';
import { friendshipKey } from '../../features/friendships/friendship-key';
import { StandardFriendshipDto } from '../../features/friendships/standard-friendship-dto';

// A paged list of people, shared by the friends page (its three tabs) and a profile's Friends tab: a row
// for each (UserRow), and below them what the list is doing: loading, failed with a way to try again, or
// empty. Nothing marks the end of a list that has rows. The owner of the list decides what a click does;
// this only shows it and reports it:
//   <app-friend-list [list]="store.list(FriendsTab.Incoming)" [texts]="…" [retryLabel]="…"
//     [actions]="[FriendshipAction.Accept, FriendshipAction.Decline]"
//     (action)="perform($event.action, $event.friendship)" (more)="loadMore()" />
// Each row offers the buttons in actions, and a Message button that leads to the conversation when
// canMessage is on (only for the user's own friends). A row whose id is in waitingIds says "Deleting…" in
// place of its buttons, and one in fadingIds fades out (DeleteFade).
@Component({
  selector: 'app-friend-list',
  imports: [EmptyState, LoadFailure, ScrollSentinel, UserRow, LucideUsers],
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

  protected readonly PageLoadStatus = PageLoadStatus;
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
}
