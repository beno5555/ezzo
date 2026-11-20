import { Component, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideHeart, LucideMessageCircle } from '@lucide/angular';
import { DateFormatter } from '../../core/languages/date-formatter';
import { LanguageStore } from '../../core/languages/language-store';
import { appAddresses } from '../../core/routing/app-addresses';
import { PostLikeApi } from '../../features/posts/post-like-api';
import { StandardPostDisplayDto } from '../../features/posts/standard-post-display-dto';
import { toggledLike } from '../../features/posts/toggled-like';
import { ActionButton } from '../action-button/action-button';
import { Avatar } from '../avatar/avatar';
import { PhotoGrid } from '../photos/photo-grid/photo-grid';
import { TextLink } from '../text-link/text-link';
import { ToastStore } from '../toasts/toast-store';

// One post in a list: the feed, a profile's posts, the post's own page and the admin panel, so it sits
// in shared/. It likes and unlikes by itself, and changes only after the server answers: it then emits
// the changed post, and the list that owns the post puts it in place (PagedList.replace). A failed like
// shows a toast and changes nothing.
//   <app-post-card [post]="post" (postChange)="list.replace($event)" />
// An author whose account is unavailable has no id, and is shown as text with no link.
@Component({
  selector: 'app-post-card',
  imports: [
    RouterLink,
    ActionButton,
    Avatar,
    PhotoGrid,
    TextLink,
    LucideHeart,
    LucideMessageCircle,
  ],
  templateUrl: './post-card.html',
  styleUrl: './post-card.css',
})
export class PostCard {
  private readonly postLikeApi = inject(PostLikeApi);
  private readonly toastStore = inject(ToastStore);

  readonly post = input.required<StandardPostDisplayDto>();
  readonly postChange = output<StandardPostDisplayDto>();

  protected readonly text = inject(LanguageStore).text;
  protected readonly dateFormatter = inject(DateFormatter);
  protected readonly isAuthorAvailable = computed(() => this.post().author.id !== null);
  // The avatar picks its disc by id; an unavailable author gets the grey disc, whatever the id.
  protected readonly authorAvatarId = computed(() => this.post().author.id ?? 0);
  protected readonly profileAddress = computed(() =>
    appAddresses.profile(this.post().author.username),
  );
  protected readonly postAddress = computed(() => appAddresses.post(this.post().id));
  // Set while a like or an unlike is on its way, so a second click cannot send the opposite one too. The
  // button is marked aria-disabled rather than disabled, which would drop the keyboard focus.
  protected readonly isLiking = signal(false);

  async toggleLike(): Promise<void> {
    const isIdle = !this.isLiking();
    if (isIdle) {
      const post = this.post();
      this.isLiking.set(true);
      const result = post.likedByCaller
        ? await this.postLikeApi.unlike(post.id)
        : await this.postLikeApi.like(post.id);
      this.isLiking.set(false);

      if (result.succeeded) {
        this.postChange.emit(toggledLike(post));
      } else {
        this.toastStore.show(result.message);
      }
    }
  }
}
