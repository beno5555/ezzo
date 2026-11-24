import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, isActive } from '@angular/router';
import LucideHouse from 'lucide/dist/esm/icons/house.mjs';
import LucideMessageCircle from 'lucide/dist/esm/icons/message-circle.mjs';
import LucideUsers from 'lucide/dist/esm/icons/users.mjs';
import { IncomingRequestsStore } from '../../../features/friendships/incoming-requests-store';
import { UnreadStore } from '../../../features/messages/unread-store';
import { Button } from '../../../shared/button/button';
import { Icon } from '../../../shared/icon/icon';
import { LanguageStore } from '../../languages/language-store';
import { appAddresses } from '../../routing/app-addresses';
import { SessionStore } from '../../session/session-store';
import { homeLinkMatch } from '../bar-link/home-link-match';
import { TopBarLink } from '../bar-link/top-bar-link';
import { CountBadge } from '../count-badge/count-badge';
import { countBadgeText } from '../count-badge/count-badge-text';
import { isOnAccountPage } from '../is-on-account-page';
import { isOnLandingPage } from '../is-on-landing-page';
import { Logo } from '../logo/logo';
import { PreferencesMenu } from '../preferences-menu/preferences-menu';
import { SearchBox } from '../search-box/search-box';
import { UserMenu } from '../user-menu/user-menu';

// The bar at the top of every page (spec, Shell). From 768 px up, a signed-in user gets the logo, the
// search box, Feed, Friends and Messages with their counts, and the menu under the profile picture. On a
// phone the bar keeps the logo and the menu, and the bottom bar carries the rest. A guest gets the logo,
// the search box, Sign in, Register and the language and theme menu, on every width.
// The search page has its own labelled box, so the bar leaves its box out there, on every width. An
// account page (register, the password pages and reactivation) keeps only the logo, and the landing page
// only the language and theme menu, as its big name carries the logo.
@Component({
  selector: 'app-top-bar',
  imports: [
    RouterLink,
    TopBarLink,
    Button,
    CountBadge,
    Logo,
    PreferencesMenu,
    SearchBox,
    UserMenu,
    Icon,
  ],
  templateUrl: './top-bar.html',
  styleUrl: './top-bar.css',
})
export class TopBar {
  protected readonly icons = {
    house: LucideHouse,
    messageCircle: LucideMessageCircle,
    users: LucideUsers,
  };

  private readonly unreadCount = inject(UnreadStore).count;

  protected readonly text = inject(LanguageStore).text;
  protected readonly isSignedIn = inject(SessionStore).isSignedIn;
  protected readonly addresses = appAddresses;
  protected readonly homeLinkMatch = homeLinkMatch;
  protected readonly unreadBadge = computed(() => countBadgeText(this.unreadCount()));
  protected readonly waitingBadge = inject(IncomingRequestsStore).badge;
  protected readonly isOnSearchPage = isActive(appAddresses.search, inject(Router), {
    paths: 'exact',
    queryParams: 'ignored',
  });
  protected readonly isOnAccountPage = isOnAccountPage();
  protected readonly isOnLandingPage = isOnLandingPage();
}
