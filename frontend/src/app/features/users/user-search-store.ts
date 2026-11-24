import { Injectable, inject, signal } from '@angular/core';
import { withoutId } from '../../core/collections/without-id';
import { LanguageStore } from '../../core/languages/language-store';
import { PagedList } from '../../core/paging/paged-list';
import { SessionStore } from '../../core/session/session-store';
import { ConfirmationOpener } from '../../shared/confirmation/confirmation-opener';
import { ToastStore } from '../../shared/toasts/toast-store';
import { answersRequest } from '../friendships/answers-request';
import { askToRemoveFriend } from '../friendships/ask-to-remove-friend';
import { FriendshipAction } from '../friendships/friendship-action';
import {
  friendshipActionsOffered,
  relationshipAfter,
} from '../friendships/friendship-actions-offered';
import { FriendshipApi } from '../friendships/friendship-api';
import { IncomingRequestsStore } from '../friendships/incoming-requests-store';
import { sendFriendshipAction } from '../friendships/send-friendship-action';
import { SearchUserDto } from './search-user-dto';

// The friendship buttons on the rows of the search results. The search page provides its own
// (providers: [UserSearchStore]). A guest, and the user's own row, get no buttons; any other row gets the
// ones its relationship offers (friendshipActionsOffered), as on a profile. An action shows the relationship
// it leads to on the click, by replacing the row in the list it came from (quick actions in the spec show
// their result at once), and the server hears of it at the same time. If the server refuses, the row goes
// back and a toast says why. Remove friend asks first, naming the loss of the messages. While a person's
// request is on its way their buttons are switched off (busyIds), so a second click cannot cross it. A
// list that is no longer the page's latest takes the change too, where nobody sees it (ADR 0003).
//   protected readonly searchStore = inject(UserSearchStore);
//   await this.searchStore.perform(FriendshipAction.Add, user, list);
@Injectable()
export class UserSearchStore {
  private readonly friendshipApi = inject(FriendshipApi);
  private readonly incomingRequests = inject(IncomingRequestsStore);
  private readonly confirmationOpener = inject(ConfirmationOpener);
  private readonly sessionStore = inject(SessionStore);
  private readonly toastStore = inject(ToastStore);
  private readonly text = inject(LanguageStore).text;

  private readonly sendingIds = signal<ReadonlySet<number>>(new Set());

  // The ids of the people whose request is on its way.
  readonly busyIds = this.sendingIds.asReadonly();

  // The buttons a row offers: none to a guest, none on the user's own row.
  actionsFor(user: SearchUserDto): FriendshipAction[] {
    const isSignedIn = this.sessionStore.isSignedIn();
    const isOther = user.id !== this.sessionStore.userId();

    return isSignedIn && isOther ? friendshipActionsOffered(user.relationship) : [];
  }

  async perform(
    action: FriendshipAction,
    user: SearchUserDto,
    list: PagedList<SearchUserDto>,
  ): Promise<void> {
    const isIdle = !this.sendingIds().has(user.id);

    if (isIdle) {
      this.sendingIds.update((ids) => new Set(ids).add(user.id));
      await this.carryOut(action, user, list);

      this.sendingIds.update((ids) => withoutId(ids, user.id));
    }
  }

  private async carryOut(
    action: FriendshipAction,
    user: SearchUserDto,
    list: PagedList<SearchUserDto>,
  ): Promise<void> {
    const isConfirmed =
      action !== FriendshipAction.Remove ||
      (await askToRemoveFriend(
        this.confirmationOpener,
        this.text().friendships.removeConfirmation,
        user.username,
      ));

    if (isConfirmed) {
      list.replace({ ...user, relationship: relationshipAfter(action, user.relationship) });
      const result = await sendFriendshipAction(this.friendshipApi, action, user.id);

      if (result.succeeded) {
        if (answersRequest(action)) {
          await this.incomingRequests.refresh();
        }
      } else {
        list.replace(user);
        this.toastStore.show(result.message);
      }
    }
  }
}
