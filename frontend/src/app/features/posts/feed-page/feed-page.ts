import { Component, OnInit, computed, inject } from '@angular/core';
import { LucideCircleExclamationPoint, LucideNewspaper } from '@lucide/angular';
import { LanguageStore } from '../../../core/languages/language-store';
import { LIMITS } from '../../../core/limits';
import { PageLoadStatus } from '../../../core/paging/page-load-status';
import { PagedList } from '../../../core/paging/paged-list';
import { Button } from '../../../shared/button/button';
import { PostCard } from '../../../shared/post-card/post-card';
import { ScrollSentinel } from '../../../shared/scroll-sentinel/scroll-sentinel';
import { PostApi } from '../post-api';
import { PostLikeStore } from '../post-like-store';
import { StandardPostDisplayDto } from '../standard-post-display-dto';

// The ranked feed at /feed, for a signed-in user. It loads page after page as the reader scrolls, through
// a PagedList: the first paged list, whose shape the comments, the profile, the friends lists, the chat
// and the admin tables copy. The end of the list shows what the list is doing: loading, failed with a
// way to try again, or ended. An empty list shows the same states in place of the posts.
@Component({
  selector: 'app-feed-page',
  imports: [Button, PostCard, ScrollSentinel, LucideCircleExclamationPoint, LucideNewspaper],
  templateUrl: './feed-page.html',
  styleUrl: './feed-page.css',
})
export class FeedPage implements OnInit {
  private readonly postApi = inject(PostApi);

  protected readonly text = inject(LanguageStore).text;
  protected readonly postLikes = inject(PostLikeStore);
  protected readonly PageLoadStatus = PageLoadStatus;
  protected readonly feed = new PagedList<StandardPostDisplayDto>({
    loadPage: (query) => this.postApi.getFeed(query),
    pageSize: LIMITS.paging.defaultPageSize,
    keyOf: (post) => post.id,
  });
  protected readonly hasPosts = computed(() => this.feed.items().length > 0);

  async ngOnInit(): Promise<void> {
    await this.feed.loadNext();
  }

  // From the scroll sentinel, and from the Try again button after a failed page.
  async loadMore(): Promise<void> {
    await this.feed.loadNext();
  }

  // A card's like button: the post changes in place at once, and back if the server refuses.
  async toggleLike(post: StandardPostDisplayDto): Promise<void> {
    await this.postLikes.toggle(post, (shown) => this.feed.replace(shown));
  }
}
