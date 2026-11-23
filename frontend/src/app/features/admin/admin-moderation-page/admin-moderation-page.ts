import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { LucideMessageCircleDashed, LucideShieldCheck } from '@lucide/angular';
import { LanguageStore } from '../../../core/languages/language-store';
import { LIMITS } from '../../../core/limits';
import { PageLoadStatus } from '../../../core/paging/page-load-status';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { LoadFailure } from '../../../shared/load-failure/load-failure';
import { ScrollSentinel } from '../../../shared/scroll-sentinel/scroll-sentinel';
import { Tab } from '../../../shared/tabs/tab';
import { panelId, tabId } from '../../../shared/tabs/tab-ids';
import { Tabs } from '../../../shared/tabs/tabs';
import { ToastStore } from '../../../shared/toasts/toast-store';
import { CommentSnapshotDto } from '../../moderation/comment-snapshot-dto';
import { ModerationApi } from '../../moderation/moderation-api';
import { ModerationStatus } from '../../moderation/moderation-status';
import { PostSnapshotDto } from '../../moderation/post-snapshot-dto';
import { AdminApi } from '../admin-api';
import { CommentSnapshot } from '../comment-snapshot/comment-snapshot';
import { FlaggedItem } from '../flagged-item/flagged-item';
import { PostSnapshot } from '../post-snapshot/post-snapshot';
import { QueueTab } from '../queue-tab';
import { SettlingList } from '../settling-list';

// The admin panel's moderation queue at /admin/moderation: one page with a Posts tab and a Comments tab,
// each a queue of its own on the server, read page after page as the reader scrolls. The comments are read
// when their tab is first opened. Hide and Make visible settle an item: it fades out and leaves the queue
// on the click, and a refusal brings it back with a toast (SettlingList).
@Component({
  selector: 'app-admin-moderation-page',
  imports: [
    CommentSnapshot,
    EmptyState,
    FlaggedItem,
    LoadFailure,
    PostSnapshot,
    ScrollSentinel,
    Tabs,
    LucideMessageCircleDashed,
    LucideShieldCheck,
  ],
  templateUrl: './admin-moderation-page.html',
  styleUrl: './admin-moderation-page.css',
})
export class AdminModerationPage implements OnInit {
  private readonly adminApi = inject(AdminApi);
  private readonly moderationApi = inject(ModerationApi);
  private readonly toastStore = inject(ToastStore);

  protected readonly text = inject(LanguageStore).text;
  protected readonly PageLoadStatus = PageLoadStatus;
  protected readonly QueueTab = QueueTab;
  protected readonly ModerationStatus = ModerationStatus;
  protected readonly tabIdOf = tabId;
  protected readonly panelIdOf = panelId;
  protected readonly tabsIdPrefix = 'moderation';

  protected readonly tabs = computed<Tab[]>(() => {
    const texts = this.text().admin.moderation;

    return [
      { key: QueueTab.Posts, label: texts.postsTab },
      { key: QueueTab.Comments, label: texts.commentsTab },
    ];
  });
  protected readonly selectedTab = signal<QueueTab>(QueueTab.Posts);
  private hasOpenedComments = false;

  protected readonly posts = new SettlingList<PostSnapshotDto>({
    loadPage: (page) => this.adminApi.getFlaggedPosts(page),
    pageSize: LIMITS.paging.defaultPageSize,
  });
  protected readonly comments = new SettlingList<CommentSnapshotDto>({
    loadPage: (page) => this.adminApi.getFlaggedComments(page),
    pageSize: LIMITS.paging.defaultPageSize,
  });
  protected readonly hasPosts = computed(() => this.posts.rows().length > 0);
  protected readonly hasComments = computed(() => this.comments.rows().length > 0);

  async ngOnInit(): Promise<void> {
    await this.posts.loadNext();
  }

  // From the tabs. The comments queue is read the first time its tab is shown, and by scrolling after that.
  async chooseTab(tab: string): Promise<void> {
    const isComments = tab === QueueTab.Comments;

    this.selectedTab.set(isComments ? QueueTab.Comments : QueueTab.Posts);

    if (isComments && !this.hasOpenedComments) {
      this.hasOpenedComments = true;
      await this.comments.loadNext();
    }
  }

  // From the scroll sentinel, and from the Try again button after a failed page.
  async loadMorePosts(): Promise<void> {
    await this.posts.loadNext();
  }

  async loadMoreComments(): Promise<void> {
    await this.comments.loadNext();
  }

  async settlePost(post: PostSnapshotDto, status: ModerationStatus): Promise<void> {
    const failure = await this.posts.settle(post, () =>
      this.moderationApi.setPostStatus(post.id, status),
    );

    if (failure !== null) {
      this.toastStore.show(failure);
    }
  }

  async settleComment(comment: CommentSnapshotDto, status: ModerationStatus): Promise<void> {
    const failure = await this.comments.settle(comment, () =>
      this.moderationApi.setCommentStatus(comment.id, status),
    );

    if (failure !== null) {
      this.toastStore.show(failure);
    }
  }
}
