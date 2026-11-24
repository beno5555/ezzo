import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import LucideSearch from 'lucide/dist/esm/icons/search.mjs';
import { LanguageStore } from '../../../core/languages/language-store';
import { appAddresses } from '../../../core/routing/app-addresses';
import { Button } from '../../../shared/button/button';
import { Icon } from '../../../shared/icon/icon';
import { Tab } from '../../../shared/tabs/tab';
import { panelId, tabId } from '../../../shared/tabs/tab-ids';
import { Tabs } from '../../../shared/tabs/tabs';
import { FriendList } from '../../../shared/friend-list/friend-list';
import { FriendshipAction } from '../friendship-action';
import { FriendsPageStore } from '../friends-page-store';
import { FriendsTab } from '../friends-tab';
import { IncomingRequestsStore } from '../incoming-requests-store';
import { StandardFriendshipDto } from '../standard-friendship-dto';

// The friends page at /friends, for a signed-in user: three tabs, each a paged list from the backend (My
// friends, the requests waiting for the user's answer, the requests the user sent). A tab's list is read
// the first time the tab opens, and every panel stays mounted, so a switch back keeps the pages loaded.
// My friends rows also have a Message button that leads to the conversation.
// The count on the Friends link is read again on each visit, and after an accept or a decline
// (FriendsPageStore). The count and the incoming list do not update live (spec, "Last in line").
@Component({
  selector: 'app-friends-page',
  imports: [Button, FriendList, RouterLink, Tabs, Icon],
  providers: [FriendsPageStore],
  templateUrl: './friends-page.html',
  styleUrl: './friends-page.css',
})
export class FriendsPage implements OnInit {
  protected readonly icons = { search: LucideSearch };

  private readonly incomingRequests = inject(IncomingRequestsStore);

  protected readonly store = inject(FriendsPageStore);
  protected readonly text = inject(LanguageStore).text;
  protected readonly tabIdOf = tabId;
  protected readonly panelIdOf = panelId;
  protected readonly tabsIdPrefix = 'friends';
  protected readonly searchAddress = appAddresses.search;
  protected readonly FriendsTab = FriendsTab;
  // The buttons each list offers on a row (My friends also has Message, which is a link).
  protected readonly actionsOfTab: Record<FriendsTab, readonly FriendshipAction[]> = {
    [FriendsTab.Friends]: [FriendshipAction.Remove],
    [FriendsTab.Incoming]: [FriendshipAction.Accept, FriendshipAction.Decline],
    [FriendsTab.Sent]: [FriendshipAction.Cancel],
  };
  // The tabs in the order they are shown, which is also the order of their panels.
  protected readonly tabKeys: readonly FriendsTab[] = [
    FriendsTab.Friends,
    FriendsTab.Incoming,
    FriendsTab.Sent,
  ];

  protected readonly tabs = computed<Tab[]>(() => {
    const labels = this.text().friendships.page;
    const labelOf: Record<FriendsTab, string> = {
      [FriendsTab.Friends]: labels.myFriendsTab,
      [FriendsTab.Incoming]: labels.incomingTab,
      [FriendsTab.Sent]: labels.sentTab,
    };

    return this.tabKeys.map((key) => ({ key, label: labelOf[key] }));
  });
  protected readonly selectedTab = signal<FriendsTab>(FriendsTab.Friends);

  async ngOnInit(): Promise<void> {
    await Promise.all([this.incomingRequests.refresh(), this.store.open(FriendsTab.Friends)]);
  }

  // The tabs component hands its selection back as the key it was given, as text.
  protected async select(key: string): Promise<void> {
    const tab = this.tabKeys.find((candidate) => candidate === key);

    if (tab !== undefined) {
      this.selectedTab.set(tab);
      await this.store.open(tab);
    }
  }

  protected async loadMore(tab: FriendsTab): Promise<void> {
    await this.store.loadMore(tab);
  }

  protected async perform(
    action: FriendshipAction,
    friendship: StandardFriendshipDto,
  ): Promise<void> {
    await this.store.perform(action, friendship);
  }
}
