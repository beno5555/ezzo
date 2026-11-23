import { Component, OnInit, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideCake, LucideMessageCircle, LucideSettings } from '@lucide/angular';
import { DateFormatter } from '../../../core/languages/date-formatter';
import { LanguageStore } from '../../../core/languages/language-store';
import { appAddresses } from '../../../core/routing/app-addresses';
import { SessionStore } from '../../../core/session/session-store';
import { AvatarSize } from '../../../shared/avatar/avatar-size';
import { Avatar } from '../../../shared/avatar/avatar';
import { Button } from '../../../shared/button/button';
import { ButtonLook } from '../../../shared/button/button-look';
import { LoadFailure } from '../../../shared/load-failure/load-failure';
import { Menu } from '../../../shared/menu/menu';
import { MenuEntry } from '../../../shared/menu/menu-entry';
import { Tab } from '../../../shared/tabs/tab';
import { panelId, tabId } from '../../../shared/tabs/tab-ids';
import { Tabs } from '../../../shared/tabs/tabs';
import { FriendshipAction } from '../../friendships/friendship-action';
import { RelationshipReadStatus } from '../../friendships/relationship-read-status';
import { RelationshipStore } from '../../friendships/relationship-store';
import { canReportUser } from '../../reports/can-report-user';
import { ReportOpener } from '../../reports/report-opener';
import { ReportTargetType } from '../../reports/report-target-type';
import { ProfileFriends } from '../profile-friends/profile-friends';
import { ProfilePosts } from '../profile-posts/profile-posts';
import { StandardUserDto } from '../standard-user-dto';
import { ProfileTab } from './profile-tab';

// Which look each friendship button takes: one primary action on the screen, Remove in danger.
const actionLooks: Record<FriendshipAction, ButtonLook> = {
  [FriendshipAction.Add]: ButtonLook.Primary,
  [FriendshipAction.Accept]: ButtonLook.Primary,
  [FriendshipAction.Cancel]: ButtonLook.Quiet,
  [FriendshipAction.Decline]: ButtonLook.Quiet,
  [FriendshipAction.Remove]: ButtonLook.Danger,
};

// One user's profile: the header (picture, username, birthday as a day and a month, bio), the buttons for
// the visitor, and the tabs below. The visitor sees:
//   - a guest: the header and the posts, read-only, with nothing where the buttons go and no Friends tab;
//   - the user on their own profile: a link to the settings where another profile has the friendship button;
//   - a signed-in user on someone else's: the friendship button for the relationship the backend reports
//     (RelationshipStore), a Message button for a friend, and a "…" menu with Report.
// The posts and the friends are lists of their own components. The Friends tab loads when it is first opened
// and stays, hidden, while another tab is shown, so a switch back does not load again.
@Component({
  selector: 'app-profile-view',
  imports: [
    Avatar,
    Button,
    LoadFailure,
    Menu,
    ProfileFriends,
    ProfilePosts,
    RouterLink,
    Tabs,
    LucideCake,
    LucideMessageCircle,
    LucideSettings,
  ],
  providers: [RelationshipStore],
  templateUrl: './profile-view.html',
  styleUrl: './profile-view.css',
})
export class ProfileView implements OnInit {
  readonly user = input.required<StandardUserDto>();

  private readonly sessionStore = inject(SessionStore);
  private readonly reportOpener = inject(ReportOpener);
  protected readonly relationships = inject(RelationshipStore);
  protected readonly text = inject(LanguageStore).text;
  protected readonly dateFormatter = inject(DateFormatter);
  protected readonly AvatarSize = AvatarSize;
  protected readonly RelationshipReadStatus = RelationshipReadStatus;
  protected readonly ProfileTab = ProfileTab;
  protected readonly settingsAddress = appAddresses.settings;
  protected readonly tabIdOf = tabId;
  protected readonly panelIdOf = panelId;
  protected readonly tabsIdPrefix = 'profile';

  protected readonly isSignedIn = this.sessionStore.isSignedIn;
  protected readonly isOwn = computed(() => this.sessionStore.userId() === this.user().id);
  // The friendship button's place: someone else's profile, for a signed-in visitor. A guest gets nothing.
  protected readonly hasFriendshipButton = computed(() => this.isSignedIn() && !this.isOwn());
  protected readonly conversationAddress = computed(() =>
    appAddresses.conversation(this.user().username),
  );
  protected readonly tabs = computed<Tab[]>(() => {
    const labels = this.text().users.profile;
    const posts = { key: ProfileTab.Posts, label: labels.postsTab };
    const friends = { key: ProfileTab.Friends, label: labels.friendsTab };

    return this.isSignedIn() ? [posts, friends] : [posts];
  });
  // The tabs component hands its selection back as the key it was given.
  protected readonly selectedTab = signal<string>(ProfileTab.Posts);
  // Once the Friends tab has been shown it stays mounted, so its pages are kept.
  protected readonly hasOpenedFriends = linkedSignal<boolean, boolean>({
    source: () => this.selectedTab() === ProfileTab.Friends,
    computation: (isFriendsShown, previous) => isFriendsShown || (previous?.value ?? false),
  });
  protected readonly birthday = computed(() =>
    this.dateFormatter.birthday(this.user().dateOfBirth),
  );
  protected readonly menuEntries = computed<readonly MenuEntry[]>(() => {
    const canReport = canReportUser(this.sessionStore.userId(), this.user().id);

    return canReport
      ? [
          {
            label: this.text().shared.content.reportEntry,
            isDestructive: false,
            choose: () => void this.reportOpener.report(ReportTargetType.User, this.user().id),
          },
        ]
      : [];
  });

  async ngOnInit(): Promise<void> {
    if (this.hasFriendshipButton()) {
      await this.relationships.load(this.user().id);
    }
  }

  protected lookOf(action: FriendshipAction): ButtonLook {
    return actionLooks[action];
  }

  async perform(action: FriendshipAction): Promise<void> {
    await this.relationships.perform(action, this.user());
  }

  async retryRelationship(): Promise<void> {
    await this.relationships.load(this.user().id);
  }
}
