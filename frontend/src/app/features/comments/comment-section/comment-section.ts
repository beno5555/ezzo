import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideCircleExclamationPoint, LucideMessageCircle } from '@lucide/angular';
import { LanguageStore } from '../../../core/languages/language-store';
import { PageLoadStatus } from '../../../core/paging/page-load-status';
import { appAddresses, returnAddressParameter } from '../../../core/routing/app-addresses';
import { SessionStore } from '../../../core/session/session-store';
import { Button } from '../../../shared/button/button';
import { ScrollSentinel } from '../../../shared/scroll-sentinel/scroll-sentinel';
import { CommentForm } from '../comment-form/comment-form';
import { CommentItem } from '../comment-item/comment-item';
import { CommentThreadStore } from '../comment-thread-store';

// What sits under a post on its own page: its comments, loaded page after page as the reader scrolls (the
// feed's way, through a PagedList), and under them the form for a signed-in user or a link to sign-in for
// a guest. The section provides the CommentThreadStore its items and its form use.
//   <app-comment-section [postId]="post.id" [postAuthorId]="post.author.id" (countChange)="…" />
// countChange tells the page how the post's comment count moves, +1 and -1, as a comment is sent,
// refused or deleted, so the card above shows the count at once (CommentThreadStore.start).
@Component({
  selector: 'app-comment-section',
  imports: [
    Button,
    CommentForm,
    CommentItem,
    RouterLink,
    ScrollSentinel,
    LucideCircleExclamationPoint,
    LucideMessageCircle,
  ],
  providers: [CommentThreadStore],
  templateUrl: './comment-section.html',
  styleUrl: './comment-section.css',
})
export class CommentSection implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly postId = input.required<number>();
  // The id of the post's author, null for an unavailable account.
  readonly postAuthorId = input.required<number | null>();
  readonly countChange = output<number>();

  protected readonly thread = inject(CommentThreadStore);
  protected readonly text = inject(LanguageStore).text;
  protected readonly isSignedIn = inject(SessionStore).isSignedIn;
  protected readonly PageLoadStatus = PageLoadStatus;
  protected readonly signInAddress = appAddresses.signIn;
  // Sign-in returns to this post's page.
  protected readonly signInParameters = computed(() => ({
    [returnAddressParameter]: appAddresses.post(this.postId()).join('/'),
  }));
  protected readonly hasComments = computed(() => this.thread.shown().length > 0);

  private readonly form = viewChild(CommentForm);

  constructor() {
    // A comment the server refused goes back into the form, once the form is empty, so that what the
    // user is writing now is never overwritten.
    effect(() => {
      const form = this.form();
      const canTakeBack = form !== undefined && this.thread.hasReturnedText() && form.isEmpty();

      if (canTakeBack) {
        untracked(() => {
          form.fill(this.thread.takeReturnedText() ?? '');
        });
      }
    });
  }

  async ngOnInit(): Promise<void> {
    // A comment may still be on its way when the user leaves, and then there is no output left to emit
    // on.
    this.thread.start(this.postId(), (change) => {
      if (!this.destroyRef.destroyed) {
        this.countChange.emit(change);
      }
    });
    await this.thread.list.loadNext();
  }

  // From the scroll sentinel, and from the Try again button after a failed page.
  async loadMore(): Promise<void> {
    await this.thread.list.loadNext();
  }

  async send(content: string): Promise<void> {
    await this.thread.send(content);
  }
}
