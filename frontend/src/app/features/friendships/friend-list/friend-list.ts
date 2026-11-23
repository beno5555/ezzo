import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideUsers } from '@lucide/angular';
import { LanguageStore } from '../../../core/languages/language-store';
import { PageLoadStatus } from '../../../core/paging/page-load-status';
import { PagedList } from '../../../core/paging/paged-list';
import { appAddresses } from '../../../core/routing/app-addresses';
import { Avatar } from '../../../shared/avatar/avatar';
import { Button } from '../../../shared/button/button';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { LoadFailure } from '../../../shared/load-failure/load-failure';
import { ScrollSentinel } from '../../../shared/scroll-sentinel/scroll-sentinel';
import { TextLink } from '../../../shared/text-link/text-link';
import { FriendshipAction } from '../friendship-action';
import { friendshipActionLooks } from '../friendship-action-looks';
import { friendshipKey } from '../friendship-key';
import { FriendsTab } from '../friends-tab';
import { StandardFriendshipDto } from '../standard-friendship-dto';

// The buttons each list offers on a row.
const actionsOfTab: Record<FriendsTab, readonly FriendshipAction[]> = {
  [FriendsTab.Friends]: [FriendshipAction.Remove],
  [FriendsTab.Incoming]: [FriendshipAction.Accept, FriendshipAction.Decline],
  [FriendsTab.Sent]: [FriendshipAction.Cancel],
};

// One list of the friends page: its rows (each a link to the person's profile, with the list's buttons),
// and below them what the list is doing: loading, failed with a way to try again, ended, or empty. The
// page owns the list and decides what a button does; this only shows and reports the click:
//   <app-friend-list [tab]="FriendsTab.Incoming" [list]="store.list(FriendsTab.Incoming)"
//     (action)="perform($event.action, $event.friendship)" (more)="loadMore(FriendsTab.Incoming)" />
// A person whose account is deactivated or deleted comes without an id and under a placeholder name: a row
// of plain text, with no link and no buttons, since every call needs the id.
@Component({
  selector: 'app-friend-list',
  imports: [
    Avatar,
    Button,
    EmptyState,
    LoadFailure,
    RouterLink,
    ScrollSentinel,
    TextLink,
    LucideUsers,
  ],
  templateUrl: './friend-list.html',
  styleUrl: './friend-list.css',
})
export class FriendList {
  readonly tab = input.required<FriendsTab>();
  readonly list = input.required<PagedList<StandardFriendshipDto>>();

  // A click on a row's button.
  readonly action = output<{ action: FriendshipAction; friendship: StandardFriendshipDto }>();
  // The scroll sentinel was reached, or Try again was pressed.
  readonly more = output<void>();

  protected readonly text = inject(LanguageStore).text;
  protected readonly PageLoadStatus = PageLoadStatus;
  protected readonly profileAddress = appAddresses.profile;
  protected readonly lookOf = (action: FriendshipAction) => friendshipActionLooks[action];
  protected readonly keyOf = friendshipKey;

  protected readonly texts = computed(() => this.text().friendships.page.lists[this.tab()]);
  protected readonly actions = computed(() => actionsOfTab[this.tab()]);
  protected readonly hasRows = computed(() => this.list().items().length > 0);

  protected actionLabel(action: FriendshipAction, username: string): string {
    return this.text().friendships.page.rowActionLabel(
      this.text().friendships.actions[action],
      username,
    );
  }
}
