import { HttpStatusCode } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import { LanguageStore } from '../../../core/languages/language-store';
import { NotFoundPage } from '../../../core/not-found/not-found-page';
import { appAddresses } from '../../../core/routing/app-addresses';
import { routePath } from '../../../core/routing/route-path';
import { signInAddress } from '../../../core/routing/sign-in-address';
import { SessionStore } from '../../../core/session/session-store';
import { BackLink } from '../../../shared/back-link/back-link';
import { CommentSection } from '../../../shared/comment-section/comment-section';
import { LoadFailure } from '../../../shared/load-failure/load-failure';
import { PostCard } from '../../../shared/post-card/post-card';
import { PostApi } from '../post-api';
import { PostEditStore } from '../post-edit-store';
import { PostLikeStore } from '../post-like-store';
import { StandardPostDisplayDto } from '../standard-post-display-dto';
import { PostPageStatus } from './post-page-status';

// One post at /posts/:postId, for a guest too: the post's card, and under it its comments (the comment
// section). The address is the post's to share. A post that does not exist, or that the visitor may not
// read, shows the not-found page at the same address. The like button leads a guest to sign-in and back; a
// signed-in user also gets a link back to the page the post was opened from, the feed when it was opened
// directly (a guest has no feed to go back to).
// The post's comment count follows the section: it rises when a comment is sent and falls when one is
// refused or deleted, so the card is right before the server has answered.
@Component({
  selector: 'app-post-page',
  imports: [BackLink, CommentSection, LoadFailure, NotFoundPage, PostCard],
  templateUrl: './post-page.html',
  styleUrl: './post-page.css',
})
export class PostPage {
  private readonly postApi = inject(PostApi);
  private readonly router = inject(Router);
  private readonly sessionStore = inject(SessionStore);
  private readonly postEdits = inject(PostEditStore);

  // From the route, as the text of the address's last segment (withComponentInputBinding).
  readonly postId = input.required<string>();

  protected readonly text = inject(LanguageStore).text;
  protected readonly isSignedIn = this.sessionStore.isSignedIn;
  protected readonly postLikes = inject(PostLikeStore);
  protected readonly PostPageStatus = PostPageStatus;
  protected readonly status = signal<PostPageStatus>(PostPageStatus.Loading);
  protected readonly post = signal<StandardPostDisplayDto | null>(null);
  protected readonly failureMessage = signal<string | null>(null);
  // The post as the card shows it: with the new title and text while the author's edit is on its way.
  protected readonly displayedPost = computed(() => {
    const post = this.post();

    return post === null ? null : (this.postEdits.pendingEdit(post.id) ?? post);
  });

  constructor() {
    // The address can change to another post while the page stays open, so the page loads in an effect.
    effect(() => {
      const postId = this.postId();

      untracked(() => {
        void this.load(postId);
      });
    });

    // The server's copy of an edit the author sent from the edit page takes the post's place.
    const stopShowingEdits = this.postEdits.onSaved((saved) => {
      this.post.update((post) =>
        post !== null && post.id === saved.id ? this.postLikes.withUnsettledLike(saved) : post,
      );
    });

    inject(DestroyRef).onDestroy(stopShowingEdits);
  }

  private async load(postIdText: string): Promise<void> {
    const postId = Number(postIdText);
    const isPossibleId = Number.isInteger(postId) && postId > 0;

    this.status.set(PostPageStatus.Loading);
    this.post.set(null);
    if (isPossibleId) {
      const result = await this.postApi.getById(postId);
      const isStillWanted = this.postId() === postIdText;

      if (isStillWanted) {
        if (result.succeeded) {
          this.post.set(this.postLikes.withUnsettledLike(result.data));
          this.status.set(PostPageStatus.Ready);
        } else if (result.status === HttpStatusCode.NotFound) {
          this.status.set(PostPageStatus.NotFound);
        } else {
          this.failureMessage.set(result.message);
          this.status.set(PostPageStatus.Failed);
        }
      }
    } else {
      this.status.set(PostPageStatus.NotFound);
    }
  }

  async retry(): Promise<void> {
    await this.load(this.postId());
  }

  async toggleLike(post: StandardPostDisplayDto): Promise<void> {
    if (this.sessionStore.isSignedIn()) {
      this.postLikes.toggle(post, (shown) => this.post.set(shown));
    } else {
      await this.router.navigateByUrl(
        signInAddress(this.router, appAddresses.post(post.id).join('/')),
      );
    }
  }

  // Check the current route after the server responds and the card fades out. The reader may have
  // followed a link while the deletion was pending.
  async deletePost(post: StandardPostDisplayDto): Promise<void> {
    await this.postEdits.delete(post, () => {
      const postAddress = this.router.createUrlTree(appAddresses.post(post.id)).toString();
      const isStillHere = routePath(this.router.url) === postAddress;

      if (isStillHere) {
        // Fire-and-forget on purpose: the store's toast must not wait for the navigation.
        void this.router.navigateByUrl(appAddresses.home);
      }
    });
  }

  // From the comment section: +1 for a comment sent, -1 for one refused or deleted.
  changeCommentCount(change: number): void {
    this.post.update((post) =>
      post === null ? post : { ...post, commentCount: post.commentCount + change },
    );
  }
}
