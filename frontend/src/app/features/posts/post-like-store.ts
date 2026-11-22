import { Injectable, inject } from '@angular/core';
import { ToastStore } from '../../shared/toasts/toast-store';
import { PostLikeApi } from './post-like-api';
import { StandardPostDisplayDto } from './standard-post-display-dto';
import { toggledLike } from './toggled-like';

// How long the store waits after the last click on a post's like button before it tells the server.
export const likeSendDelayMilliseconds = 1000;

// What the store knows about a post whose like was clicked and is not settled with the server yet.
interface UnsettledLike {
  // The post as it was before the first click, which a refusal puts back.
  readonly original: StandardPostDisplayDto;
  // Whether the server holds a like of the caller's, as far as the store knows.
  isLikedOnServer: boolean;
  // What the post shows now, which the server is to be brought to.
  isLikedOnScreen: boolean;
  show: (post: StandardPostDisplayDto) => void;
  waitingFor: ReturnType<typeof setTimeout> | null;
  isSending: boolean;
}

// Likes and unlikes posts for every page that shows post cards: the feed, a profile's posts, the post's
// own page and the admin panel. The card only asks; the page calls toggle with the function that puts a
// post in its list.
//   protected readonly postLikes = inject(PostLikeStore);
//   <app-post-card [post]="post" (likeToggle)="toggleLike(post)" />
//   toggleLike(post: StandardPostDisplayDto): void {
//     this.postLikes.toggle(post, (shown) => this.feed.replace(shown));
//   }
// The like shows at once, on the click (owner, 2026-11-20), and the server hears of it a second after the
// last click on that post (owner, 2026-11-22). Clicking again meanwhile never waits for an answer: a like
// that is taken back inside the second is never sent, and neither is an unlike that is taken back. What
// goes to the server is only the difference between what it holds and what the post shows once the
// clicking stops. If the server refuses, the post is put back as it was before the first click and a
// toast says why.
// A page that loads posts from the server while a click is unsettled passes each through
// withUnsettledLike, so the post does not show the like the server does not have yet.
@Injectable({ providedIn: 'root' })
export class PostLikeStore {
  private readonly postLikeApi = inject(PostLikeApi);
  private readonly toastStore = inject(ToastStore);

  private readonly unsettled = new Map<number, UnsettledLike>();

  // post is the post as the page shows it now, with the like turned over by an earlier click if there was
  // one. show puts a post in the page's list: first the post with its like turned over, and again the
  // post as it was when the server refuses.
  toggle(post: StandardPostDisplayDto, show: (post: StandardPostDisplayDto) => void): void {
    const known = this.unsettled.get(post.id);
    const like: UnsettledLike = known ?? {
      original: post,
      isLikedOnServer: post.likedByCaller,
      isLikedOnScreen: post.likedByCaller,
      show,
      waitingFor: null,
      isSending: false,
    };

    like.isLikedOnScreen = !post.likedByCaller;
    like.show = show;
    this.unsettled.set(post.id, like);
    show(toggledLike(post));
    this.waitThenSend(post.id, like);
  }

  // The post with the click that has not reached the server yet applied to it, for a page that has just
  // loaded it. A post with no such click comes back as it is.
  withUnsettledLike(post: StandardPostDisplayDto): StandardPostDisplayDto {
    const like = this.unsettled.get(post.id);
    const isBehind = like !== undefined && like.isLikedOnScreen !== post.likedByCaller;

    return isBehind ? toggledLike(post) : post;
  }

  // Starts the second over. While a request is on its way nothing starts: its answer decides what is next.
  private waitThenSend(postId: number, like: UnsettledLike): void {
    if (like.waitingFor !== null) {
      clearTimeout(like.waitingFor);
      like.waitingFor = null;
    }

    if (!like.isSending) {
      const isSettled = like.isLikedOnScreen === like.isLikedOnServer;

      if (isSettled) {
        this.unsettled.delete(postId);
      } else {
        like.waitingFor = setTimeout(() => {
          like.waitingFor = null;
          void this.send(postId, like);
        }, likeSendDelayMilliseconds);
      }
    }
  }

  private async send(postId: number, like: UnsettledLike): Promise<void> {
    const wantsLike = like.isLikedOnScreen;

    like.isSending = true;
    const result = wantsLike
      ? await this.postLikeApi.like(postId)
      : await this.postLikeApi.unlike(postId);
    like.isSending = false;

    if (result.succeeded) {
      like.isLikedOnServer = wantsLike;
      // Clicks that came while the request was on its way may have turned the post over again.
      this.waitThenSend(postId, like);
    } else {
      this.unsettled.delete(postId);
      like.show(like.original);
      this.toastStore.show(result.message);
    }
  }
}
