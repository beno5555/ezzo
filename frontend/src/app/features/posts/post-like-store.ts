import { Injectable, inject, signal } from '@angular/core';
import { ToastStore } from '../../shared/toasts/toast-store';
import { PostLikeApi } from './post-like-api';
import { StandardPostDisplayDto } from './standard-post-display-dto';
import { toggledLike } from './toggled-like';

// Likes and unlikes posts for every page that shows post cards: the feed, a profile's posts, the post's
// own page and the admin panel. The card only asks; the page calls toggle with the function that puts a
// post in its list. The like shows at once, on the click (owner, 2026-11-20); if the server refuses, the
// post is put back as it was and a toast says why.
//   protected readonly postLikes = inject(PostLikeStore);
//   <app-post-card [post]="post" [isLiking]="postLikes.isLiking(post.id)" (likeToggle)="toggleLike(post)" />
//   async toggleLike(post: StandardPostDisplayDto): Promise<void> {
//     await this.postLikes.toggle(post, (shown) => this.feed.replace(shown));
//   }
@Injectable({ providedIn: 'root' })
export class PostLikeStore {
  private readonly postLikeApi = inject(PostLikeApi);
  private readonly toastStore = inject(ToastStore);

  // The posts whose like or unlike is on its way. A click on one of them is ignored, so the server never
  // gets a like and an unlike of the same post at once.
  private readonly pendingIds = signal<ReadonlySet<number>>(new Set());

  isLiking(postId: number): boolean {
    return this.pendingIds().has(postId);
  }

  // show puts a post in the page's list: first the post with its like turned over, and again the post as
  // it was when the server refuses.
  async toggle(
    post: StandardPostDisplayDto,
    show: (post: StandardPostDisplayDto) => void,
  ): Promise<void> {
    const isIdle = !this.isLiking(post.id);

    if (isIdle) {
      this.setPending(post.id, true);
      show(toggledLike(post));
      const result = post.likedByCaller
        ? await this.postLikeApi.unlike(post.id)
        : await this.postLikeApi.like(post.id);
      this.setPending(post.id, false);

      if (!result.succeeded) {
        show(post);
        this.toastStore.show(result.message);
      }
    }
  }

  private setPending(postId: number, isPending: boolean): void {
    this.pendingIds.update((ids) => {
      const next = new Set(ids);
      if (isPending) {
        next.add(postId);
      } else {
        next.delete(postId);
      }
      return next;
    });
  }
}
