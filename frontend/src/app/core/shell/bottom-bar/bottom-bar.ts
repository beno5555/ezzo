import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideHouse,
  LucideMessageCircle,
  LucideSearch,
  LucideUserRound,
  LucideUsers,
} from '@lucide/angular';
import { IncomingRequestsStore } from '../../../features/friendships/incoming-requests-store';
import { UnreadStore } from '../../../features/messages/unread-store';
import { LanguageStore } from '../../languages/language-store';
import { appAddresses } from '../../routing/app-addresses';
import { SessionStore } from '../../session/session-store';
import { BottomBarLink } from '../bar-link/bottom-bar-link';
import { CountBadge } from '../count-badge/count-badge';
import { countBadgeText } from '../count-badge/count-badge-text';

// The phone's bar along the bottom of the screen, for a signed-in user under 768 px: Feed, Search,
// Friends, Messages and Profile, with the same two counts as the top bar. It is fixed to the screen, so
// it also puts a spacer of its own height at the end of the page, which keeps it from covering content.
@Component({
  selector: 'app-bottom-bar',
  imports: [
    RouterLink,
    BottomBarLink,
    CountBadge,
    LucideHouse,
    LucideSearch,
    LucideUsers,
    LucideMessageCircle,
    LucideUserRound,
  ],
  templateUrl: './bottom-bar.html',
  styleUrl: './bottom-bar.css',
  host: { class: 'md:hidden' },
})
export class BottomBar {
  private readonly unreadCount = inject(UnreadStore).count;

  protected readonly text = inject(LanguageStore).text;
  protected readonly user = inject(SessionStore).user;
  protected readonly addresses = appAddresses;
  protected readonly unreadBadge = computed(() => countBadgeText(this.unreadCount()));
  protected readonly waitingBadge = inject(IncomingRequestsStore).badge;
}
