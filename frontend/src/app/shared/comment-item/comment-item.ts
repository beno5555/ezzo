import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DateFormatter } from '../../core/languages/date-formatter';
import { LanguageStore } from '../../core/languages/language-store';
import { appAddresses } from '../../core/routing/app-addresses';
import { SessionStore } from '../../core/session/session-store';
import { Avatar } from '../avatar/avatar';
import { AvatarSize } from '../avatar/avatar-size';
import { ContentAction } from '../content-actions/content-action';
import { contentActionsOffered } from '../content-actions/content-actions-offered';
import { contentMenuEntries } from '../content-actions/content-menu-entries';
import { HiddenBadge } from '../hidden-badge/hidden-badge';
import { Menu } from '../menu/menu';
import { MenuEntry } from '../menu/menu-entry';
import { TextLink } from '../text-link/text-link';
import { CommentForm } from '../comment-form/comment-form';
import { CommentThreadStore } from '../../features/comments/comment-thread-store';
import { ShownComment } from '../../features/comments/shown-comment';
import { ModeratedKind } from '../../features/moderation/moderated-kind';
import { ModerationStore } from '../../features/moderation/moderation-store';
import { ReportOpener } from '../../features/reports/report-opener';
import { ReportTargetType } from '../../features/reports/report-target-type';

// One comment under a post. It lives inside a comment section, which provides the CommentThreadStore that
// sends the edit and the deletion; the item only shows the comment and its "…" menu.
//   <app-comment-item [shown]="shown" [postAuthorId]="post.author.id" />
// The menu's entries come from contentActionsOffered (shared/content-actions): Edit and Delete for the
// author, Delete for the post's author, Report for another signed-in user, and for an administrator also
// Delete and Hide or Make visible. Report opens the report dialog; Hide and Make visible go through
// ModerationStore, which also says whether the comment shows the "Hidden" badge. A comment still on its
// way to the server, or being saved, has no menu: there is nothing on the server to change yet, and a
// second change would race the first. An edit opens a form in place of the text; saving shows the new
// text at once with "Sending…", and an edit the server refuses opens the form again with what the author
// wrote (CommentThreadStore.takeReturnedEdit).
@Component({
  selector: 'app-comment-item',
  imports: [Avatar, CommentForm, HiddenBadge, Menu, RouterLink, TextLink],
  templateUrl: './comment-item.html',
  styleUrl: './comment-item.css',
})
export class CommentItem {
  private readonly thread = inject(CommentThreadStore);
  private readonly sessionStore = inject(SessionStore);
  private readonly moderation = inject(ModerationStore);
  private readonly reportOpener = inject(ReportOpener);

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
  private readonly isChangeable = computed(
    () => this.shown().isOnServer && !this.shown().isSending,
  );
  // The comment's moderation state as shown: what an administrator has set here, else its own flag.
  protected readonly isHidden = computed(() =>
    this.moderation.isHidden(ModeratedKind.Comment, this.comment().id, this.comment().isHidden),
  );
  protected readonly menuEntries = computed<readonly MenuEntry[]>(() => {
    const actions = this.isChangeable()
      ? contentActionsOffered(
          {
            userId: this.sessionStore.userId(),
            isAdministrator: this.sessionStore.isAdministrator(),
          },
          {
            authorId: this.comment().author.id,
            isHidden: this.isHidden(),
            postAuthorId: this.postAuthorId(),
          },
        )
      : [];

    return contentMenuEntries(actions, this.text().shared.content, {
      [ContentAction.Edit]: () => this.startEditing(),
      [ContentAction.Delete]: () => void this.remove(),
      [ContentAction.Hide]: () =>
        void this.moderation.setHidden(ModeratedKind.Comment, this.comment().id, true),
      [ContentAction.MakeVisible]: () =>
        void this.moderation.setHidden(ModeratedKind.Comment, this.comment().id, false),
      [ContentAction.Report]: () =>
        void this.reportOpener.report(ReportTargetType.Comment, this.comment().id),
    });
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
