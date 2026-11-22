import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DateFormatter } from '../../core/languages/date-formatter';
import { LanguageStore } from '../../core/languages/language-store';
import { appAddresses } from '../../core/routing/app-addresses';
import { SessionStore } from '../../core/session/session-store';
import { Avatar } from '../avatar/avatar';
import { AvatarSize } from '../avatar/avatar-size';
import { Menu } from '../menu/menu';
import { MenuEntry } from '../menu/menu-entry';
import { TextLink } from '../text-link/text-link';
import { CommentForm } from '../comment-form/comment-form';
import { CommentThreadStore } from '../../features/comments/comment-thread-store';
import { ShownComment } from '../../features/comments/shown-comment';

// One comment under a post. It lives inside a comment section, which provides the CommentThreadStore that
// sends the edit and the deletion; the item only shows the comment and its "…" menu.
//   <app-comment-item [shown]="shown" [postAuthorId]="post.author.id" />
// The menu offers Edit to the comment's author and Delete to the author and to the post's author, and
// nobody else. A comment still on its way to the server, or being saved, has no menu: there is nothing on
// the server to change yet, and a second change would race the first. An edit opens a form in place of
// the text; saving shows the new text at once with "Sending…", and an edit the server refuses opens the
// form again with what the author wrote (CommentThreadStore.takeReturnedEdit). Report, Hide and Make visible
// join the menu with ticket 13.
@Component({
  selector: 'app-comment-item',
  imports: [Avatar, CommentForm, Menu, RouterLink, TextLink],
  templateUrl: './comment-item.html',
  styleUrl: './comment-item.css',
})
export class CommentItem {
  private readonly thread = inject(CommentThreadStore);
  private readonly sessionStore = inject(SessionStore);

  readonly shown = input.required<ShownComment>();
  // The id of the post's author, null for an unavailable account.
  readonly postAuthorId = input.required<number | null>();

  protected readonly text = inject(LanguageStore).text;
  protected readonly dateFormatter = inject(DateFormatter);
  protected readonly AvatarSize = AvatarSize;
  protected readonly isEditing = signal(false);
  // What the edit form opens with: the comment's text, or what a refused edit's author had written.
  protected readonly editInitialContent = signal('');

  private readonly comment = computed(() => this.shown().comment);
  protected readonly isAuthorAvailable = computed(() => this.comment().author.id !== null);
  // The avatar picks its disc by id; an unavailable author gets the grey disc, whatever the id.
  protected readonly authorAvatarId = computed(() => this.comment().author.id ?? 0);
  protected readonly profileAddress = computed(() =>
    appAddresses.profile(this.comment().author.username),
  );
  protected readonly isOwn = computed(() => {
    const userId = this.sessionStore.userId();

    return userId !== null && this.comment().author.id === userId;
  });
  private readonly isCallersPost = computed(() => {
    const userId = this.sessionStore.userId();

    return userId !== null && this.postAuthorId() === userId;
  });
  private readonly isChangeable = computed(
    () => this.shown().isOnServer && !this.shown().isSending,
  );
  private readonly canEdit = computed(() => this.isChangeable() && this.isOwn());
  private readonly canDelete = computed(
    () => this.isChangeable() && (this.isOwn() || this.isCallersPost()),
  );
  protected readonly menuEntries = computed<readonly MenuEntry[]>(() => {
    const labels = this.text().comments.menu;
    const entries: MenuEntry[] = [];

    if (this.canEdit()) {
      entries.push({
        label: labels.editEntry,
        isDestructive: false,
        choose: () => this.startEditing(),
      });
    }
    if (this.canDelete()) {
      entries.push({
        label: labels.deleteEntry,
        isDestructive: true,
        choose: () => void this.remove(),
      });
    }

    return entries;
  });

  constructor() {
    // An edit the server refused comes back as an open form holding what the author wrote.
    effect(() => {
      const returned = this.thread.returnedEdit(this.comment().id);

      if (returned !== null) {
        untracked(() => {
          this.thread.takeReturnedEdit(this.comment().id);
          this.editInitialContent.set(returned);
          this.isEditing.set(true);
        });
      }
    });
  }

  startEditing(): void {
    this.editInitialContent.set(this.comment().content);
    this.isEditing.set(true);
  }

  stopEditing(): void {
    this.isEditing.set(false);
  }

  // An edit that changes nothing sends nothing.
  async saveEdit(content: string): Promise<void> {
    const isChanged = content !== this.comment().content;

    this.isEditing.set(false);
    if (isChanged) {
      await this.thread.edit(this.comment(), content);
    }
  }

  async remove(): Promise<void> {
    await this.thread.remove(this.comment());
  }
}
