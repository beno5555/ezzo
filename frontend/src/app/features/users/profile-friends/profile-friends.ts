import { Component, effect, inject, input, linkedSignal, untracked } from '@angular/core';
import { LanguageStore } from '../../../core/languages/language-store';
import { LIMITS } from '../../../core/limits';
import { PagedList } from '../../../core/paging/paged-list';
import { FriendList } from '../../../shared/friend-list/friend-list';
import { FriendshipApi } from '../../friendships/friendship-api';
import { friendshipKey } from '../../friendships/friendship-key';
import { StandardFriendshipDto } from '../../friendships/standard-friendship-dto';

// The Friends tab of a profile: the user's accepted friends, loaded page after page, each a link to their
// profile (the shared FriendList, with no buttons: these are another person's friends). The backend
// requires sign-in for this list, so the profile offers the tab to a signed-in visitor only. A friend whose
// account is deactivated or deleted comes without an id and under a placeholder name, and is shown as
// plain text with no link.
// reloadKey changes when the visitor's own friendship with this user changes, which may add or remove the
// visitor in the list: the list then starts again from the first page.
@Component({
  selector: 'app-profile-friends',
  imports: [FriendList],
  templateUrl: './profile-friends.html',
  styleUrl: './profile-friends.css',
})
export class ProfileFriends {
  readonly userId = input.required<number>();
  readonly reloadKey = input(0);

  private readonly friendshipApi = inject(FriendshipApi);
  protected readonly text = inject(LanguageStore).text;
  protected readonly friends = linkedSignal<number, PagedList<StandardFriendshipDto>>({
    source: this.reloadKey,
    computation: () => this.createList(),
  });

  constructor() {
    // Loads the first page of the list the page has now: at the start, and after each new list.
    effect(() => {
      const list = this.friends();

      untracked(() => {
        void list.loadNext();
      });
    });
  }

  // From the scroll sentinel, and from the Try again button after a failed page.
  async loadMore(): Promise<void> {
    await this.friends().loadNext();
  }

  private createList(): PagedList<StandardFriendshipDto> {
    return new PagedList<StandardFriendshipDto>({
      loadPage: (query) => this.friendshipApi.getFriendsOf(this.userId(), query),
      pageSize: LIMITS.paging.defaultPageSize,
      keyOf: friendshipKey,
    });
  }
}
