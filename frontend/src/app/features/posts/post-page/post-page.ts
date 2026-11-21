import { HttpStatusCode } from '@angular/common/http';
import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { LucideCircleExclamationPoint } from '@lucide/angular';
import { LanguageStore } from '../../../core/languages/language-store';
import { NotFoundPage } from '../../../core/not-found/not-found-page';
import { appAddresses } from '../../../core/routing/app-addresses';
import { signInAddress } from '../../../core/routing/sign-in-address';
import { SessionStore } from '../../../core/session/session-store';
import { Button } from '../../../shared/button/button';
import { PostCard } from '../../../shared/post-card/post-card';
import { CommentSection } from '../../comments/comment-section/comment-section';
import { PostApi } from '../post-api';
import { PostLikeStore } from '../post-like-store';
import { StandardPostDisplayDto } from '../standard-post-display-dto';
import { PostPageStatus } from './post-page-status';

// One post at /posts/:postId, for a guest too: the post's card, and under it its comments (the comment
// section). The address is the post's to share. A post that does not exist, or that the visitor may not
// read, shows the not-found page at the same address. The like button leads a guest to sign-in and back.
// The post's comment count follows the section: it rises when a comment is sent and falls when one is
// refused or deleted, so the card is right before the server has answered.
@Component({
  selector: 'app-post-page',
  imports: [Button, CommentSection, NotFoundPage, PostCard, LucideCircleExclamationPoint],
  templateUrl: './post-page.html',
  styleUrl: './post-page.css',
})
export class PostPage {
  private readonly postApi = inject(PostApi);
  private readonly router = inject(Router);
  private readonly sessionStore = inject(SessionStore);

  // From the route, as the text of the address's last segment (withComponentInputBinding).
  readonly postId = input.required<string>();

  protected readonly text = inject(LanguageStore).text;
  protected readonly postLikes = inject(PostLikeStore);
  protected readonly PostPageStatus = PostPageStatus;
  protected readonly status = signal<PostPageStatus>(PostPageStatus.Loading);
  protected readonly post = signal<StandardPostDisplayDto | null>(null);
  protected readonly failureMessage = signal<string | null>(null);

  constructor() {
    // The address can change to another post while the page stays open, so the page loads in an effect.
    effect(() => {
      const postId = this.postId();

      untracked(() => {
        void this.load(postId);
      });
    });
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
          this.post.set(result.data);
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

  // The card's like button. A guest is sent to sign-in, which returns to this post.
  async toggleLike(post: StandardPostDisplayDto): Promise<void> {
    if (this.sessionStore.isSignedIn()) {
      await this.postLikes.toggle(post, (shown) => this.post.set(shown));
    } else {
      await this.router.navigateByUrl(
        signInAddress(this.router, appAddresses.post(post.id).join('/')),
      );
    }
  }

  // From the comment section: +1 for a comment sent or a deletion refused, -1 for one refused or deleted.
  changeCommentCount(change: number): void {
    this.post.update((post) =>
      post === null ? post : { ...post, commentCount: post.commentCount + change },
    );
  }
}
