import { HttpStatusCode } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { AppResult } from '../../core/http/app-result';
import { LanguageStore } from '../../core/languages/language-store';
import { ConfirmationOpener } from '../../shared/confirmation/confirmation-opener';
import { ToastStore } from '../../shared/toasts/toast-store';
import { FriendshipAction } from './friendship-action';
import { friendshipActionsOffered, relationshipAfter } from './friendship-actions-offered';
import { FriendshipApi } from './friendship-api';
import { FriendshipStatus } from './friendship-status';
import { IncomingRequestsStore } from './incoming-requests-store';
import { Relationship } from './relationship';
import { RelationshipReadStatus } from './relationship-read-status';
import { StandardUserDto } from '../users/standard-user-dto';

// The signed-in user's relationship with the person whose profile is open, and the friendship actions on it.
// A profile provides its own (providers: [RelationshipStore]), so it lives and dies with that profile.
// An action shows the relationship it leads to on the click (quick actions in the spec show their result at once;
// PostLikeStore is the pattern), and the server hears of it at the same time. If the server refuses, the
// relationship goes back to what it was and a toast says why. Remove friend asks first, naming the loss of
// the messages, and only a confirmed one changes anything. While a request is on its way the buttons are
// switched off (isBusy), so a second click can never cross the first one's answer.
//   protected readonly relationships = inject(RelationshipStore);
//   await this.relationships.load(user.id);
//   await this.relationships.perform(FriendshipAction.Add, user);
@Injectable()
export class RelationshipStore {
  private readonly friendshipApi = inject(FriendshipApi);
  private readonly incomingRequests = inject(IncomingRequestsStore);
  private readonly confirmationOpener = inject(ConfirmationOpener);
  private readonly toastStore = inject(ToastStore);
  private readonly text = inject(LanguageStore).text;

  private readonly current = signal<Relationship | null>(null);
  private readonly readStatus = signal<RelationshipReadStatus>(RelationshipReadStatus.Loading);
  private readonly lastFailure = signal<string | null>(null);
  private readonly sending = signal(false);
  private readonly changes = signal(0);

  // Null while there is no relationship at all.
  readonly relationship = this.current.asReadonly();
  readonly status = this.readStatus.asReadonly();
  readonly failureMessage = this.lastFailure.asReadonly();
  readonly isBusy = this.sending.asReadonly();
  // The buttons the relationship, as shown now, offers.
  readonly actions = computed(() => friendshipActionsOffered(this.current()));
  readonly isFriend = computed(() => this.current()?.status === FriendshipStatus.Accepted);
  // Rises each time the server has accepted an action that changes the person's friends (Accept, Remove), for
  // what shows those friends to read them again.
  readonly changeCount = this.changes.asReadonly();

  async load(userId: number): Promise<void> {
    this.readStatus.set(RelationshipReadStatus.Loading);
    const result = await this.friendshipApi.getRelationship(userId);

    if (result.succeeded) {
      this.current.set({ status: result.data.status, isRequester: result.data.isRequester });
      this.readStatus.set(RelationshipReadStatus.Ready);
    } else if (result.status === HttpStatusCode.NotFound) {
      // The backend answers 404 for two people with no relationship.
      this.current.set(null);
      this.readStatus.set(RelationshipReadStatus.Ready);
    } else {
      this.lastFailure.set(result.message);
      this.readStatus.set(RelationshipReadStatus.Failed);
    }
  }

  // The person is the profile's user: the id for the call, the name for the warning.
  async perform(
    action: FriendshipAction,
    person: Pick<StandardUserDto, 'id' | 'username'>,
  ): Promise<void> {
    if (!this.sending()) {
      const isConfirmed = action !== FriendshipAction.Remove || (await this.askToRemove(person));

      if (isConfirmed) {
        const before = this.current();

        this.current.set(relationshipAfter(action, before));
        this.sending.set(true);
        const result = await this.send(action, person.id);
        this.sending.set(false);

        if (result.succeeded) {
          await this.afterAccepted(action);
        } else {
          this.current.set(before);
          this.toastStore.show(result.message);
        }
      }
    }
  }

  // What an action the server accepted changes elsewhere: the person's friends (the visitor joins or leaves
  // them) after Accept and Remove, and the count of requests waiting for the visitor's answer after Accept
  // and Decline.
  private async afterAccepted(action: FriendshipAction): Promise<void> {
    const changesFriends = action === FriendshipAction.Accept || action === FriendshipAction.Remove;
    const answersRequest =
      action === FriendshipAction.Accept || action === FriendshipAction.Decline;

    if (changesFriends) {
      this.changes.update((count) => count + 1);
    }

    if (answersRequest) {
      await this.incomingRequests.refresh();
    }
  }

  private askToRemove(person: Pick<StandardUserDto, 'username'>): Promise<boolean> {
    const texts = this.text().friendships.removeConfirmation;

    return this.confirmationOpener.ask({
      question: texts.question(person.username),
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
}
