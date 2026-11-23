import { Injectable, inject } from '@angular/core';
import { AppResult } from '../../core/http/app-result';
import { LanguageStore } from '../../core/languages/language-store';
import { PageQuery } from '../../core/http/page-query';
import { LIMITS } from '../../core/limits';
import { PagedList } from '../../core/paging/paged-list';
import { ConfirmationOpener } from '../../shared/confirmation/confirmation-opener';
import { DeleteFade } from '../../shared/fade-out/delete-fade';
import { ToastStore } from '../../shared/toasts/toast-store';
import { FriendshipAction } from './friendship-action';
import { FriendshipApi } from './friendship-api';
import { friendshipKey } from './friendship-key';
import { FriendshipStatus } from './friendship-status';
import { FriendsTab } from './friends-tab';
import { IncomingRequestsStore } from './incoming-requests-store';
import { StandardFriendshipDto } from './standard-friendship-dto';

// The list an action takes a person out of: Accept and Decline answer an incoming request, Cancel
// withdraws a sent one, and Remove ends a friendship.
const sourceTabs: Record<FriendshipAction, FriendsTab | null> = {
  [FriendshipAction.Add]: null,
  [FriendshipAction.Cancel]: FriendsTab.Sent,
  [FriendshipAction.Accept]: FriendsTab.Incoming,
  [FriendshipAction.Decline]: FriendsTab.Incoming,
  [FriendshipAction.Remove]: FriendsTab.Friends,
};

// The three lists of the friends page (My friends, Incoming requests, Sent requests) and the actions on
// their rows. The page provides its own (providers: [FriendsPageStore]), so the lists live and die with it.
// A list is read the first time its tab opens. Accept, Decline and Cancel take the row out of its list on
// the click (quick actions in the spec show their result at once; PostLikeStore is the pattern), Accept puts
// the person on top of My friends, and the server hears of it at the same time. If the server refuses, the
// row goes back where it was and a toast says why. Remove is a deletion, so it is slower and clearer (owner,
// 2026-11-23): it asks first, naming the loss of the messages; the row then says "Deleting…" until the
// server answers, and on a yes fades out and leaves (DeleteFade, as for a post). A refusal leaves the row
// as it was, with a toast. A second click on a person whose request is on its way is ignored.
//   protected readonly store = inject(FriendsPageStore);
//   await this.store.open(FriendsTab.Incoming);
//   await this.store.perform(FriendshipAction.Accept, friendship);
@Injectable()
export class FriendsPageStore {
  private readonly friendshipApi = inject(FriendshipApi);
  private readonly incomingRequests = inject(IncomingRequestsStore);
  private readonly confirmationOpener = inject(ConfirmationOpener);
  private readonly toastStore = inject(ToastStore);
  private readonly text = inject(LanguageStore).text;

  private readonly lists: Record<FriendsTab, PagedList<StandardFriendshipDto>> = {
    [FriendsTab.Friends]: this.createList((query) => this.friendshipApi.getFriends(query)),
    [FriendsTab.Incoming]: this.createList((query) => this.friendshipApi.getPendingRequests(query)),
    [FriendsTab.Sent]: this.createList((query) => this.friendshipApi.getSentRequests(query)),
  };
  private readonly openedTabs = new Set<FriendsTab>();
  // The people whose action is waiting for a confirmation or for the server.
  private readonly busyKeys = new Set<number | string>();
  // The friends being removed: "Deleting…" while the server has not answered, then the fade-out. The set of
  // gone ids is not used: a person who left My friends can come back (a new request, accepted) and be removed
  // again, so the row leaves the list itself.
  private readonly deleteFade = new DeleteFade();

  // The ids of the friends whose row says "Deleting…", and of those fading out.
  readonly waitingIds = this.deleteFade.waitingIds;
  readonly fadingIds = this.deleteFade.fadingIds;

  list(tab: FriendsTab): PagedList<StandardFriendshipDto> {
    return this.lists[tab];
  }

  // Reads the first page of a tab's list, the first time the tab opens.
  async open(tab: FriendsTab): Promise<void> {
    const isFirstOpening = !this.openedTabs.has(tab);

    if (isFirstOpening) {
      this.openedTabs.add(tab);
      await this.lists[tab].loadNext();
    }
  }

  // The next page of a list, from its scroll sentinel and its Try again button.
  async loadMore(tab: FriendsTab): Promise<void> {
    await this.lists[tab].loadNext();
  }

  async perform(action: FriendshipAction, friendship: StandardFriendshipDto): Promise<void> {
    const personId = friendship.otherUser.id;
    const sourceTab = sourceTabs[action];
    const key = friendshipKey(friendship);
    const canAct = personId !== null && sourceTab !== null && !this.busyKeys.has(key);

    if (canAct) {
      this.busyKeys.add(key);
      if (action === FriendshipAction.Remove) {
        await this.removeFriend(friendship, personId);
      } else {
        await this.act(action, friendship, personId, this.lists[sourceTab]);
      }
      this.busyKeys.delete(key);
    }
  }

  // Asks first. The row then says "Deleting…" until the server answers; on a yes it fades out and leaves
  // My friends, on a no it stays, with a toast.
  private async removeFriend(friendship: StandardFriendshipDto, personId: number): Promise<void> {
    const isConfirmed = await this.askToRemove(friendship);

    if (isConfirmed) {
      const result = await this.deleteFade.delete(personId, () =>
        this.send(FriendshipAction.Remove, personId),
      );

      if (result.succeeded) {
        this.lists[FriendsTab.Friends].leave(friendshipKey(friendship));
      } else {
        this.toastStore.show(result.message);
      }
    }
  }

  private async act(
    action: FriendshipAction,
    friendship: StandardFriendshipDto,
    personId: number,
    source: PagedList<StandardFriendshipDto>,
  ): Promise<void> {
    const key = friendshipKey(friendship);
    const index = source.items().findIndex((entry) => friendshipKey(entry) === key);
    const friends = this.lists[FriendsTab.Friends];
    const isAccept = action === FriendshipAction.Accept;

    source.leave(key);
    if (isAccept) {
      friends.prepend({ ...friendship, status: FriendshipStatus.Accepted });
    }

    const result = await this.send(action, personId);

    if (result.succeeded) {
      const answersRequest =
        action === FriendshipAction.Accept || action === FriendshipAction.Decline;

      if (answersRequest) {
        await this.incomingRequests.refresh();
      }
    } else {
      source.insertAt(friendship, index);
      if (isAccept) {
        friends.remove(key);
      }
      this.toastStore.show(result.message);
    }
  }

  private askToRemove(friendship: StandardFriendshipDto): Promise<boolean> {
    const texts = this.text().friendships.removeConfirmation;

    return this.confirmationOpener.ask({
      question: texts.question(friendship.otherUser.username),
      detail: texts.detail,
      confirmButton: texts.confirmButton,
      isDestructive: true,
    });
  }

  // Cancel and Remove are the same call: the backend removes a relationship in any state.
  private send(action: FriendshipAction, personId: number): Promise<AppResult<unknown>> {
    const calls: Record<FriendshipAction, () => Promise<AppResult<unknown>>> = {
      [FriendshipAction.Add]: () => this.friendshipApi.sendRequest(personId),
      [FriendshipAction.Cancel]: () => this.friendshipApi.remove(personId),
      [FriendshipAction.Accept]: () => this.friendshipApi.accept(personId),
      [FriendshipAction.Decline]: () => this.friendshipApi.decline(personId),
      [FriendshipAction.Remove]: () => this.friendshipApi.remove(personId),
    };

    return calls[action]();
  }

  private createList(
    loadPage: (query: PageQuery) => Promise<AppResult<StandardFriendshipDto[]>>,
  ): PagedList<StandardFriendshipDto> {
    return new PagedList<StandardFriendshipDto>({
      loadPage,
      pageSize: LIMITS.paging.defaultPageSize,
      keyOf: friendshipKey,
    });
  }
}
