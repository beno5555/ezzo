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
import { SessionStore } from '../../core/session/session-store';
import { PostEditStore } from '../../features/posts/post-edit-store';
import { StandardPostDisplayDto } from '../../features/posts/standard-post-display-dto';
import { ActionButton } from '../action-button/action-button';
import { Avatar } from '../avatar/avatar';
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
// place (it goes nowhere). isFull, for the post's own page, shows all of it. commentsAddress is where the
// comments button leads; the post's own page sends it back to the feed.
// The "…" menu offers the post's author Edit and Delete, and nobody else (Report and the administrator's
// entries join with ticket 13). Edit leads to the edit page; a deletion goes to the page through
// postDelete, which hands it to PostEditStore, and a card being deleted fades out. A post on its way to
// the server, or whose edit is being saved, has no menu: there is nothing on the server to change yet,
// and a second change would race the first.
@Component({
  selector: 'app-post-card',
  imports: [
    RouterLink,
    ActionButton,
    Avatar,
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
  // Null leads to the post's own page.
  readonly commentsAddress = input<string | null>(null);
  readonly likeToggle = output();
  readonly postDelete = output();

  private readonly postEdits = inject(PostEditStore);
  private readonly router = inject(Router);
  private readonly sessionStore = inject(SessionStore);
  protected readonly text = inject(LanguageStore).text;
  protected readonly dateFormatter = inject(DateFormatter);
  protected readonly isSaving = computed(() => this.postEdits.isSaving(this.post().id));
  protected readonly isDeleting = computed(() => this.postEdits.isDeleting(this.post().id));
  protected readonly isMarkedUploading = computed(() => this.isUploading() || this.isSaving());
  private readonly isOwn = computed(() => {
    const userId = this.sessionStore.userId();

    return userId !== null && this.post().author.id === userId;
  });
  private readonly isChangeable = computed(() => !this.isMarkedUploading() && this.post().id > 0);
  private readonly canChange = computed(
    () => this.isOwn() && this.isChangeable() && !this.isDeleting(),
  );
  protected readonly menuEntries = computed<readonly MenuEntry[]>(() => {
    const labels = this.text().posts.menu;
    const entries: MenuEntry[] = [];

    if (this.canChange()) {
      entries.push({
        label: labels.editEntry,
        isDestructive: false,
        choose: () => void this.router.navigate(appAddresses.editPost(this.post().id)),
      });
      entries.push({
        label: labels.deleteEntry,
        isDestructive: true,
        choose: () => this.requestDelete(),
      });
    }

    return entries;
  });
  protected readonly isAuthorAvailable = computed(() => this.post().author.id !== null);
  // The avatar picks its disc by id; an unavailable author gets the grey disc, whatever the id.
  protected readonly authorAvatarId = computed(() => this.post().author.id ?? 0);
  protected readonly profileAddress = computed(() =>
    appAddresses.profile(this.post().author.username),
  );
  protected readonly commentsTarget = computed(
    () => this.commentsAddress() ?? appAddresses.post(this.post().id),
  );

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
}
