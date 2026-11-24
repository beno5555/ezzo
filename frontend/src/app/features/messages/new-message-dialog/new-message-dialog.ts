import { DialogRef } from '@angular/cdk/dialog';
import { Component, OnInit, computed, inject } from '@angular/core';
import LucideUsers from 'lucide/dist/esm/icons/users.mjs';
import { LanguageStore } from '../../../core/languages/language-store';
import { LIMITS } from '../../../core/limits';
import { PageLoadStatus } from '../../../core/paging/page-load-status';
import { PagedList } from '../../../core/paging/paged-list';
import { Avatar } from '../../../shared/avatar/avatar';
import { DialogFrame } from '../../../shared/dialog/dialog-frame/dialog-frame';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { Icon } from '../../../shared/icon/icon';
import { LoadFailure } from '../../../shared/load-failure/load-failure';
import { PresenceLabel } from '../../../shared/presence-label/presence-label';
import { ScrollSentinel } from '../../../shared/scroll-sentinel/scroll-sentinel';
import { DisplayFriendDto } from '../../friendships/display-friend-dto';
import { MessageApi } from '../message-api';

// The friends the user has no conversation with yet, by pages, opened by the New message button above the
// conversation list. Choosing one closes the dialog with that friend's username, and the page opens
// /messages/:username, where the first message creates the conversation. Opened through DialogOpener:
//   const dialogRef = this.dialogOpener.open<string, null, NewMessageDialog>(NewMessageDialog, null);
@Component({
  selector: 'app-new-message-dialog',
  imports: [Avatar, DialogFrame, EmptyState, LoadFailure, PresenceLabel, ScrollSentinel, Icon],
  templateUrl: './new-message-dialog.html',
  styleUrl: './new-message-dialog.css',
})
export class NewMessageDialog implements OnInit {
  protected readonly icons = { users: LucideUsers };

  private readonly messageApi = inject(MessageApi);
  private readonly dialogRef = inject<DialogRef<string>>(DialogRef);

  protected readonly text = inject(LanguageStore).text;
  protected readonly PageLoadStatus = PageLoadStatus;
  protected readonly friends = new PagedList<DisplayFriendDto>({
    loadPage: (query) => this.messageApi.getNonConversationFriends(query),
    pageSize: LIMITS.paging.defaultPageSize,
    keyOf: (friend) => friend.id,
  });
  protected readonly hasFriends = computed(() => this.friends.items().length > 0);

  async ngOnInit(): Promise<void> {
    await this.friends.loadNext();
  }

  // From the scroll sentinel, and from the Try again button after a failed page.
  async loadMore(): Promise<void> {
    await this.friends.loadNext();
  }

  choose(friend: DisplayFriendDto): void {
    this.dialogRef.close(friend.username);
  }
}
