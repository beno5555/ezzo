import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideCloudUpload, LucideHeart, LucideMessageCircle } from '@lucide/angular';
import { DateFormatter } from '../../core/languages/date-formatter';
import { LanguageStore } from '../../core/languages/language-store';
import { appAddresses } from '../../core/routing/app-addresses';
import { NavigationHistoryStore } from '../../core/routing/navigation-history-store';
import { SessionStore } from '../../core/session/session-store';
import { ModeratedKind } from '../../features/moderation/moderated-kind';
import { ModerationStore } from '../../features/moderation/moderation-store';
import { PostEditStore } from '../../features/posts/post-edit-store';
import { StandardPostDisplayDto } from '../../features/posts/standard-post-display-dto';
import { ReportOpener } from '../../features/reports/report-opener';
import { ReportTargetType } from '../../features/reports/report-target-type';
import { ActionButton } from '../action-button/action-button';
import { Avatar } from '../avatar/avatar';
import { ContentAction } from '../content-actions/content-action';
import { contentActionsOffered } from '../content-actions/content-actions-offered';
import { contentMenuEntries } from '../content-actions/content-menu-entries';
import { DeletingNotice } from '../deleting-notice/deleting-notice';
import { FadeOut } from '../fade-out/fade-out';
import { HiddenBadge } from '../hidden-badge/hidden-badge';
import { Menu } from '../menu/menu';
import { MenuEntry } from '../menu/menu-entry';
import { PhotoGrid } from '../photos/photo-grid/photo-grid';
import { TextLink } from '../text-link/text-link';

// One post in a list: the feed, a profile's posts, the post's own page and the admin panel, so it sits
// in shared/. It only shows the post: a click on the like button asks the page through likeToggle, and the
// page sends it through PostLikeStore, which shows the like at once (the store's comment shows how).
//   <app-post-card [post]="post" (likeToggle)="toggleLike(post)" />
// An author whose account is unavailable has no id, and is shown as text with no link. A new post still
// on its way to the server (NewPostStore) is marked as uploading in place of its like and comment
// controls, which would act on a post the server does not have yet.
// In a list the text of a long post stops after a few lines, with a See more button that opens the rest in
// place (it goes nowhere). isFull, for the post's own page, shows all of it. The comments button leads to the
// post, or, with commentsGoBack, which the post's own page sets, back to where the reader came from. The
// reader's own post says "(you)"
// after the author's name, among other people's posts; a profile, where every post is one user's, turns
// that off with [hasOwnMark]="false".
// The "…" menu's entries come from contentActionsOffered (shared/content-actions): Edit and Delete for the
// author, Report for another signed-in user, and for an administrator also Delete and Hide or Make
// visible. Edit leads to the edit page; a deletion goes to the page through postDelete, which hands it to
// PostEditStore, and a card being deleted says "Deleting…" and then fades out. Report opens the report
// dialog; Hide and Make visible go through ModerationStore, which also says whether the post shows the
// "Hidden" badge. A post on its way
// to the server, or whose edit is being saved, has no menu: there is nothing on the server to change yet,
// and a second change would race the first.
@Component({
  selector: 'app-post-card',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    ActionButton,
    Avatar,
    DeletingNotice,
    FadeOut,
    HiddenBadge,
    Menu,
    PhotoGrid,
    TextLink,
    LucideHeart,
    LucideCloudUpload,
    LucideMessageCircle,
  ],
  templateUrl: './post-card.html',
  styleUrl: './post-card.css',
})
export class PostCard {
  readonly post = input.required<StandardPostDisplayDto>();
  readonly isUploading = input(false);
  readonly isFull = input(false);
  // True on the post's own page: the comments button goes back to where the reader came from, like the
  // page's Back link, instead of to the post it is already on.
  readonly commentsGoBack = input(false);
  // False on a profile, where every post is that user's and "(you)" after the name would say nothing.
  readonly hasOwnMark = input(true);
  readonly likeToggle = output();
  readonly postDelete = output();

  private readonly postEdits = inject(PostEditStore);
  private readonly moderation = inject(ModerationStore);
  private readonly reportOpener = inject(ReportOpener);
  private readonly router = inject(Router);
  private readonly history = inject(NavigationHistoryStore);
  private readonly sessionStore = inject(SessionStore);
  protected readonly text = inject(LanguageStore).text;
  protected readonly dateFormatter = inject(DateFormatter);
  protected readonly isSaving = computed(() => this.postEdits.isSaving(this.post().id));
  protected readonly isDeleting = computed(() => this.postEdits.isDeleting(this.post().id));
  protected readonly isWaitingToDelete = computed(() =>
    this.postEdits.isWaitingToDelete(this.post().id),
  );
  protected readonly isFadingOut = computed(() => this.postEdits.isFadingOut(this.post().id));
  protected readonly isMarkedUploading = computed(() => this.isUploading() || this.isSaving());
  protected readonly isOwn = computed(() => {
    const userId = this.sessionStore.userId();

    return userId !== null && this.post().author.id === userId;
  });
  private readonly isChangeable = computed(() => !this.isMarkedUploading() && this.post().id > 0);
  // The post's moderation state as shown: what an administrator has set here, else the post's own flag.
  protected readonly isHidden = computed(() =>
    this.moderation.isHidden(ModeratedKind.Post, this.post().id, this.post().isHidden),
  );
  protected readonly menuEntries = computed<readonly MenuEntry[]>(() => {
    const isOffered = this.isChangeable() && !this.isDeleting();
    const actions = isOffered
      ? contentActionsOffered(
          {
            userId: this.sessionStore.userId(),
            isAdministrator: this.sessionStore.isAdministrator(),
          },
          { authorId: this.post().author.id, isHidden: this.isHidden(), postAuthorId: null },
        )
      : [];

    return contentMenuEntries(actions, this.text().shared.content, {
      [ContentAction.Edit]: () => void this.router.navigate(appAddresses.editPost(this.post().id)),
      [ContentAction.Delete]: () => this.requestDelete(),
      [ContentAction.Hide]: () =>
        void this.moderation.setHidden(ModeratedKind.Post, this.post().id, true),
      [ContentAction.MakeVisible]: () =>
        void this.moderation.setHidden(ModeratedKind.Post, this.post().id, false),
      [ContentAction.Report]: () =>
        void this.reportOpener.report(ReportTargetType.Post, this.post().id),
    });
  });
  protected readonly isAuthorAvailable = computed(() => this.post().author.id !== null);
  // The avatar picks its ring by id; an unavailable author gets the grey ring, whatever the id.
  protected readonly authorAvatarId = computed(() => this.post().author.id ?? 0);
  protected readonly profileAddress = computed(() =>
    appAddresses.profile(this.post().author.username),
  );
  protected readonly postAddress = computed(() => appAddresses.post(this.post().id));
  protected readonly fallbackAddress = appAddresses.home;

  private readonly content = viewChild<ElementRef<HTMLElement>>('content');
  protected readonly isExpanded = signal(false);
  protected readonly isCollapsed = computed(() => !this.isFull() && !this.isExpanded());
  // Whether the collapsed text is cut off, which only the browser knows once it has laid the text out.
  protected readonly isCut = signal(false);

  constructor() {
    // While the text is collapsed, watch whether it is cut: its width changes with the window.
    afterRenderEffect((onCleanup) => {
      const element = this.content()?.nativeElement;
      const canWatch = element !== undefined && this.isCollapsed();

      if (canWatch && typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(() => {
          this.isCut.set(element.scrollHeight > element.clientHeight);
        });

        observer.observe(element);
        onCleanup(() => observer.disconnect());
      }
    });
  }

  requestLikeToggle(): void {
    this.likeToggle.emit();
  }

  expand(): void {
    this.isExpanded.set(true);
  }

  requestDelete(): void {
    this.postDelete.emit();
  }

  // The comments button of the post's own page.
  goBack(event: MouseEvent): void {
    this.history.followBackLink(event, this.fallbackAddress);
  }
}
