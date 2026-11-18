import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideHouse, LucideMessageCircle, LucideUsers } from '@lucide/angular';
import { IncomingRequestsStore } from '../../../features/friendships/incoming-requests-store';
import { UnreadStore } from '../../../features/messages/unread-store';
import { Button } from '../../../shared/button/button';
import { LanguageStore } from '../../languages/language-store';
import { appAddresses } from '../../routing/app-addresses';
import { SessionStore } from '../../session/session-store';
import { TopBarLink } from '../bar-link/top-bar-link';
import { CountBadge } from '../count-badge/count-badge';
import { countBadgeText } from '../count-badge/count-badge-text';
import { Logo } from '../logo/logo';
import { PreferencesMenu } from '../preferences-menu/preferences-menu';
import { SearchBox } from '../search-box/search-box';
import { UserMenu } from '../user-menu/user-menu';

// The bar at the top of every page (spec, Shell). From 768 px up, a signed-in user gets the logo, the
// search box, Feed, Friends and Messages with their counts, and the menu under the profile picture. On a
// phone the bar keeps the logo and the menu, and the bottom bar carries the rest. A guest gets the logo,
// the search box, Sign in, Register and the language and theme menu, on every width.
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
    LucideHouse,
    LucideUsers,
    LucideMessageCircle,
  ],
  templateUrl: './top-bar.html',
  styleUrl: './top-bar.css',
})
export class TopBar {
  private readonly unreadCount = inject(UnreadStore).count;

  protected readonly text = inject(LanguageStore).text;
  protected readonly isSignedIn = inject(SessionStore).isSignedIn;
  protected readonly addresses = appAddresses;
  protected readonly unreadBadge = computed(() => countBadgeText(this.unreadCount()));
  protected readonly waitingBadge = inject(IncomingRequestsStore).badge;
}
