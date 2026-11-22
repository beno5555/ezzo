import { Component, DestroyRef, OnInit, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { LucideNewspaper } from '@lucide/angular';
import { LanguageStore } from '../../../core/languages/language-store';
import { LIMITS } from '../../../core/limits';
import { PageLoadStatus } from '../../../core/paging/page-load-status';
import { PagedList } from '../../../core/paging/paged-list';
import { appAddresses } from '../../../core/routing/app-addresses';
import { signInAddress } from '../../../core/routing/sign-in-address';
import { SessionStore } from '../../../core/session/session-store';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { LoadFailure } from '../../../shared/load-failure/load-failure';
import { PostCard } from '../../../shared/post-card/post-card';
import { ScrollSentinel } from '../../../shared/scroll-sentinel/scroll-sentinel';
import { NewPostStore } from '../../posts/new-post-store';
import { PostApi } from '../../posts/post-api';
import { PostEditStore } from '../../posts/post-edit-store';
import { PostLikeStore } from '../../posts/post-like-store';
import { StandardPostDisplayDto } from '../../posts/standard-post-display-dto';
import { StandardUserDto } from '../standard-user-dto';

// The Posts tab of a profile: the user's posts, newest first, loaded page after page as the reader scrolls
// (a PagedList, as the feed's), each in the post card. A guest reads them too.
// On the reader's own profile this is where a new post shows (the ranked feed never lists the caller's own
// posts): on top as pending while it uploads, then as the server's copy (NewPostStore). A post whose
// deletion PostEditStore reports is left out; the card fades and menus itself. Every post here is one
// user's, so the card leaves out its "(you)" mark.
// A guest's click on the like button leads to sign-in and back, as on a post's own page.
@Component({
  selector: 'app-profile-posts',
  imports: [EmptyState, LoadFailure, PostCard, ScrollSentinel, LucideNewspaper],
  templateUrl: './profile-posts.html',
  styleUrl: './profile-posts.css',
})
export class ProfilePosts implements OnInit {
  readonly user = input.required<StandardUserDto>();

  private readonly postApi = inject(PostApi);
  private readonly postEdits = inject(PostEditStore);
  private readonly router = inject(Router);
  private readonly sessionStore = inject(SessionStore);
  protected readonly text = inject(LanguageStore).text;
  protected readonly postLikes = inject(PostLikeStore);
  protected readonly newPosts = inject(NewPostStore);
  protected readonly PageLoadStatus = PageLoadStatus;
  protected readonly posts = new PagedList<StandardPostDisplayDto>({
    loadPage: async (query) => {
      const result = await this.postApi.getByUser(this.user().id, query);

      return result.succeeded
        ? { ...result, data: result.data.map((post) => this.postLikes.withUnsettledLike(post)) }
        : result;
    },
    pageSize: LIMITS.paging.defaultPageSize,
    keyOf: (post) => post.id,
  });
  protected readonly isOwn = computed(() => this.sessionStore.userId() === this.user().id);
  protected readonly shownPosts = computed(() =>
    this.posts.items().filter((post) => !this.postEdits.isDeleted(post.id)),
  );
  // Posts still on their way are not in the list, but they are shown, so they open it too.
  protected readonly pendingPosts = computed(() => (this.isOwn() ? this.newPosts.pending() : []));
  protected readonly hasPosts = computed(() => this.shownPosts().length > 0);
  protected readonly isListShown = computed(
    () => this.hasPosts() || this.pendingPosts().length > 0,
  );

  constructor() {
    // The server's copy of a post sent from the composer's page goes on top of the list, on its writer's
    // own profile only.
    const stopShowing = this.newPosts.onPublished((created) => {
      if (this.isOwn()) {
        this.posts.prepend(created);
      }
    });

    inject(DestroyRef).onDestroy(stopShowing);
  }

  async ngOnInit(): Promise<void> {
    await this.posts.loadNext();
  }

  // From the scroll sentinel, and from the Try again button after a failed page.
  async loadMore(): Promise<void> {
    await this.posts.loadNext();
  }

  // A card's like button: the post changes in place at once, and back if the server refuses. A guest is
  // sent to sign-in, which returns to this profile.
  async toggleLike(post: StandardPostDisplayDto): Promise<void> {
    if (this.sessionStore.isSignedIn()) {
      this.postLikes.toggle(post, (shown) => this.posts.replace(shown));
    } else {
      const profileAddress = this.router.serializeUrl(
        this.router.createUrlTree(appAddresses.profile(this.user().username)),
      );

      await this.router.navigateByUrl(signInAddress(this.router, profileAddress));
    }
  }

  // A card's deletion goes to PostEditStore, which asks first and shows it at once.
  async deletePost(post: StandardPostDisplayDto): Promise<void> {
    await this.postEdits.delete(post);
  }
}
