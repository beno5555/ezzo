import {
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideCloudUpload, LucideHeart, LucideMessageCircle } from '@lucide/angular';
import { DateFormatter } from '../../core/languages/date-formatter';
import { LanguageStore } from '../../core/languages/language-store';
import { appAddresses } from '../../core/routing/app-addresses';
import { SessionStore } from '../../core/session/session-store';
import { ImageDto } from '../../features/posts/image-dto';
import { PostEdit } from '../../features/posts/post-edit';
import { PostEditStore } from '../../features/posts/post-edit-store';
import { StandardPostDisplayDto } from '../../features/posts/standard-post-display-dto';
import { ActionButton } from '../action-button/action-button';
import { Avatar } from '../avatar/avatar';
import { Menu } from '../menu/menu';
import { MenuEntry } from '../menu/menu-entry';
import { PhotoGrid } from '../photos/photo-grid/photo-grid';
import { PostEditForm } from '../post-edit-form/post-edit-form';
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
// entries join with ticket 13). Edit opens a form in place of the title, text and photos; the card only
// shows and asks, as with likes: a save, a deletion and a photo's removal go to the page through
// postEdit, postDelete and photoRemove, which hand them to PostEditStore. A post on its way to the
// server, or whose edit is being saved, has no menu: there is nothing on the server to change yet, and
// a second change would race the first. An edit the server refuses comes back as an open form holding
// what the author wrote, on the page that sets opensReturnedEdit (the post's own page, where the
// refusal's toast leads).
@Component({
  selector: 'app-post-card',
  imports: [
    RouterLink,
    ActionButton,
    Avatar,
    Menu,
    PhotoGrid,
    PostEditForm,
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
  // Whether an edit the server refused opens its form on this card.
  readonly opensReturnedEdit = input(false);
  readonly likeToggle = output();
  readonly postEdit = output<PostEdit>();
  readonly postDelete = output();
  readonly photoRemove = output<ImageDto>();

  private readonly postEdits = inject(PostEditStore);
  private readonly sessionStore = inject(SessionStore);
  protected readonly text = inject(LanguageStore).text;
  protected readonly dateFormatter = inject(DateFormatter);
  protected readonly isEditing = signal(false);
  // What the edit form opens with: the post's title and text, or what a refused edit's author wrote.
  protected readonly editInitial = signal<PostEdit>({ title: '', content: '' });
  protected readonly isSaving = computed(() => this.postEdits.isSaving(this.post().id));
  protected readonly isRemovingPhoto = computed(() =>
    this.postEdits.isRemovingPhoto(this.post().id),
  );
  protected readonly isMarkedUploading = computed(() => this.isUploading() || this.isSaving());
  private readonly isOwn = computed(() => {
    const userId = this.sessionStore.userId();

    return userId !== null && this.post().author.id === userId;
  });
  private readonly isChangeable = computed(() => !this.isMarkedUploading() && this.post().id > 0);
  private readonly canChange = computed(
    () => this.isOwn() && this.isChangeable() && !this.isEditing(),
  );
  // Whether the server holds text for the post: it refuses to remove the last photo of a post without.
  protected readonly hasSavedText = computed(() => this.post().postContent.trim().length > 0);
  protected readonly menuEntries = computed<readonly MenuEntry[]>(() => {
    const labels = this.text().posts.menu;
    const entries: MenuEntry[] = [];

    if (this.canChange()) {
      entries.push({
        label: labels.editEntry,
        isDestructive: false,
        choose: () => this.startEditing(),
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
    // An edit the server refused comes back as an open form holding what the author wrote.
    effect(() => {
      const returned = this.opensReturnedEdit()
        ? this.postEdits.returnedEdit(this.post().id)
        : null;

      if (returned !== null) {
        untracked(() => {
          this.postEdits.takeReturnedEdit(this.post().id);
          this.editInitial.set(returned);
          this.isEditing.set(true);
        });
      }
    });

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

  startEditing(): void {
    this.editInitial.set({ title: this.post().title, content: this.post().postContent });
    this.isEditing.set(true);
  }

  stopEditing(): void {
    this.isEditing.set(false);
  }

  // An edit that changes nothing sends nothing.
  saveEdit(change: PostEdit): void {
    const isChanged =
      change.title !== this.post().title || change.content !== this.post().postContent;

    this.isEditing.set(false);
    if (isChanged) {
      this.postEdit.emit(change);
    }
  }

  requestDelete(): void {
    this.postDelete.emit();
  }

  requestPhotoRemoval(image: ImageDto): void {
    this.photoRemove.emit(image);
  }
}
