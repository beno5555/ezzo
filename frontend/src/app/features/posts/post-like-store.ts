import { Injectable, inject, signal } from '@angular/core';
import { ToastStore } from '../../shared/toasts/toast-store';
import { PostLikeApi } from './post-like-api';
import { StandardPostDisplayDto } from './standard-post-display-dto';
import { toggledLike } from './toggled-like';

// Likes and unlikes posts for every page that shows post cards: the feed, a profile's posts, the post's
// own page and the admin panel. The card only asks; the page calls toggle and puts the changed post in
// its list. A post changes only after the server answers, and a refusal shows a toast and changes nothing.
//   protected readonly postLikes = inject(PostLikeStore);
//   <app-post-card [post]="post" [isLiking]="postLikes.isLiking(post.id)" (likeToggle)="toggleLike(post)" />
//   async toggleLike(post: StandardPostDisplayDto): Promise<void> {
//     const changed = await this.postLikes.toggle(post);
//     if (changed !== null) { this.feed.replace(changed); }
//   }
@Injectable({ providedIn: 'root' })
export class PostLikeStore {
  private readonly postLikeApi = inject(PostLikeApi);
  private readonly toastStore = inject(ToastStore);

  // The posts whose like or unlike is on its way, so a second click cannot send the opposite one too.
  private readonly pendingIds = signal<ReadonlySet<number>>(new Set());

  isLiking(postId: number): boolean {
    return this.pendingIds().has(postId);
  }

  // The post with its like turned over, or null when the server refused (a toast says why) or when a
  // like of the same post is still on its way.
  async toggle(post: StandardPostDisplayDto): Promise<StandardPostDisplayDto | null> {
    let changed: StandardPostDisplayDto | null = null;
    const isIdle = !this.isLiking(post.id);

    if (isIdle) {
      this.setPending(post.id, true);
      const result = post.likedByCaller
        ? await this.postLikeApi.unlike(post.id)
        : await this.postLikeApi.like(post.id);
      this.setPending(post.id, false);

      if (result.succeeded) {
        changed = toggledLike(post);
      } else {
        this.toastStore.show(result.message);
      }
    }

    return changed;
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
