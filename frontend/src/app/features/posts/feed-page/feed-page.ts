import { Component, DestroyRef, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideNewspaper, LucidePlus } from '@lucide/angular';
import { LanguageStore } from '../../../core/languages/language-store';
import { LIMITS } from '../../../core/limits';
import { PageLoadStatus } from '../../../core/paging/page-load-status';
import { PagedList } from '../../../core/paging/paged-list';
import { appAddresses } from '../../../core/routing/app-addresses';
import { Button } from '../../../shared/button/button';
import { LoadFailure } from '../../../shared/load-failure/load-failure';
import { PostCard } from '../../../shared/post-card/post-card';
import { ScrollSentinel } from '../../../shared/scroll-sentinel/scroll-sentinel';
import { NewPostStore } from '../new-post-store';
import { PostApi } from '../post-api';
import { PostEditStore } from '../post-edit-store';
import { PostLikeStore } from '../post-like-store';
import { StandardPostDisplayDto } from '../standard-post-display-dto';

// The ranked feed at /feed, for a signed-in user. It loads page after page as the reader scrolls, through
// a PagedList: the first paged list, whose shape the comments, the profile, the friends lists, the chat
// and the admin tables copy. The end of the list shows what the list is doing: loading, failed with a
// way to try again, or ended. An empty list shows the same states in place of the posts.
@Component({
  selector: 'app-feed-page',
  imports: [Button, LoadFailure, PostCard, RouterLink, ScrollSentinel, LucideNewspaper, LucidePlus],
  templateUrl: './feed-page.html',
  styleUrl: './feed-page.css',
})
export class FeedPage implements OnInit {
  private readonly postApi = inject(PostApi);

  protected readonly text = inject(LanguageStore).text;
  protected readonly postLikes = inject(PostLikeStore);
  protected readonly PageLoadStatus = PageLoadStatus;
  protected readonly newPostAddress = appAddresses.newPost;
  protected readonly feed = new PagedList<StandardPostDisplayDto>({
    loadPage: async (query) => {
      const result = await this.postApi.getFeed(query);

      return result.succeeded
        ? { ...result, data: result.data.map((post) => this.postLikes.withUnsettledLike(post)) }
        : result;
    },
    pageSize: LIMITS.paging.defaultPageSize,
    keyOf: (post) => post.id,
  });
  protected readonly newPosts = inject(NewPostStore);
  private readonly postEdits = inject(PostEditStore);
  // The posts the feed shows: those it loaded, without a post whose deletion the author confirmed; an
  // edit on its way shows in the post's place, or on top when the ranked feed has not brought the
  // caller's own post.
  protected readonly shownPosts = computed(() => {
    const pending = this.postEdits.pendingEdits();
    const loaded = this.feed.items().filter((post) => !this.postEdits.isDeleted(post.id));
    const isLoaded = (id: number) => loaded.some((post) => post.id === id);

    return [
      ...pending.filter((post) => !isLoaded(post.id)),
      ...loaded.map((post) => pending.find((edited) => edited.id === post.id) ?? post),
    ];
  });
  // Posts still on their way are not in the list, but they are shown, so they open it too.
  protected readonly hasPosts = computed(() => this.shownPosts().length > 0);
  protected readonly isListShown = computed(
    () => this.hasPosts() || this.newPosts.pending().length > 0,
  );

  constructor() {
    // The server's copy of a post sent from the composer's page goes on top of the list.
    const stopShowing = this.newPosts.onPublished((created) => this.feed.prepend(created));
    // The server's copy of an edited post takes the post's place in the list, or goes on top of it.
    const stopShowingEdits = this.postEdits.onSaved((saved) => {
      const isListed = this.feed.items().some((post) => post.id === saved.id);
      const shown = this.postLikes.withUnsettledLike(saved);

      if (isListed) {
        this.feed.replace(shown);
      } else {
        this.feed.prepend(shown);
      }
    });

    inject(DestroyRef).onDestroy(() => {
      stopShowing();
      stopShowingEdits();
    });
  }

  async ngOnInit(): Promise<void> {
    await this.feed.loadNext();
  }

  // From the scroll sentinel, and from the Try again button after a failed page.
  async loadMore(): Promise<void> {
    await this.feed.loadNext();
  }

  // A card's like button: the post changes in place at once, and back if the server refuses.
  toggleLike(post: StandardPostDisplayDto): void {
    this.postLikes.toggle(post, (shown) => this.feed.replace(shown));
  }

  // A card's deletion goes to PostEditStore, which asks first and shows it at once.
  async deletePost(post: StandardPostDisplayDto): Promise<void> {
    await this.postEdits.delete(post);
  }
}
