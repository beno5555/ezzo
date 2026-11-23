import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideMessageCircle } from '@lucide/angular';
import { LanguageStore } from '../../core/languages/language-store';
import { appAddresses } from '../../core/routing/app-addresses';
import { FriendshipAction } from '../../features/friendships/friendship-action';
import { friendshipActionLooks } from '../../features/friendships/friendship-action-looks';
import { Avatar } from '../avatar/avatar';
import { Button } from '../button/button';
import { ButtonLook } from '../button/button-look';
import { DeletingNotice } from '../deleting-notice/deleting-notice';
import { FadeOut } from '../fade-out/fade-out';

// One person in a list: an avatar and the name (a link to the profile), then the friendship buttons the
// caller offers and, for a friend, a Message button. Shared by the friend lists (the friends page, a
// profile's Friends tab) and the search results. It is the list item itself, so a list keeps its
// semantics:
//   <ul> <li appUserRow [userId]="user.id" [username]="user.username" [actions]="actions"
//            (action)="perform($event)"></li> </ul>
// The owner of the list decides what a click does; the row only shows the buttons and reports the click.
// A person whose account is deactivated or deleted comes without an id and under a placeholder name: a
// row of plain text, with no link and no buttons, since every call needs the id. While isWaiting, the row
// says "Deleting…" in place of its buttons; while isFading it fades out (DeleteFade).
@Component({
  selector: 'li[appUserRow]',
  imports: [Avatar, Button, DeletingNotice, RouterLink, LucideMessageCircle],
  hostDirectives: [
    { directive: FadeOut, inputs: ['appFadeOut: isFading', 'appDeleting: isWaiting'] },
  ],
  templateUrl: './user-row.html',
  styleUrl: './user-row.css',
  host: {
    class: 'flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2',
    '[attr.aria-busy]': 'isInMotion() || null',
  },
})
export class UserRow {
  readonly userId = input.required<number | null>();
  readonly username = input.required<string>();
  readonly actions = input<readonly FriendshipAction[]>([]);
  readonly canMessage = input(false);
  // Switches the buttons off while a request of theirs is on its way, so a second click cannot cross it.
  readonly isBusy = input(false);

  // A click on one of the buttons.
  readonly action = output<FriendshipAction>();

  private readonly fadeOut = inject(FadeOut);
  protected readonly text = inject(LanguageStore).text;
  protected readonly profileAddress = appAddresses.profile;
  protected readonly conversationAddress = appAddresses.conversation;

  protected readonly isWaiting = computed(() => this.fadeOut.appDeleting());
  protected readonly isInMotion = computed(
    () => this.fadeOut.appDeleting() || this.fadeOut.appFadeOut(),
  );
  protected readonly isAvailable = computed(() => this.userId() !== null);

  // Remove is on every row, so it has no edge: a column of red boxes would shout (owner, 2026-11-23).
  protected lookOf(action: FriendshipAction): ButtonLook {
    return action === FriendshipAction.Remove
      ? ButtonLook.DangerText
      : friendshipActionLooks[action];
  }

  protected messageLabel(): string {
    return this.text().friendships.page.rowActionLabel(
      this.text().friendships.page.messageButton,
      this.username(),
    );
  }

  // The words on a button. Remove is short here (the profile's button says "Remove friend").
  protected actionText(action: FriendshipAction): string {
    const labels = this.text().friendships;

    return action === FriendshipAction.Remove ? labels.page.removeButton : labels.actions[action];
  }

  protected actionLabel(action: FriendshipAction): string {
    return this.text().friendships.page.rowActionLabel(
      this.text().friendships.actions[action],
      this.username(),
    );
  }
}
