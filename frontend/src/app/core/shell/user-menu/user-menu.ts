import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import LucideLogOut from 'lucide/dist/esm/icons/log-out.mjs';
import LucideSettings from 'lucide/dist/esm/icons/settings.mjs';
import LucideShield from 'lucide/dist/esm/icons/shield.mjs';
import LucideUserRound from 'lucide/dist/esm/icons/user-round.mjs';
import { Avatar } from '../../../shared/avatar/avatar';
import { AvatarSize } from '../../../shared/avatar/avatar-size';
import { Icon } from '../../../shared/icon/icon';
import { LanguageStore } from '../../languages/language-store';
import { appAddresses } from '../../routing/app-addresses';
import { SessionStore } from '../../session/session-store';
import { MenuRow } from '../menu-row/menu-row';
import { ShellPopover } from '../shell-popover/shell-popover';
import { ShellPreferences } from '../shell-preferences/shell-preferences';

// The menu under the signed-in user's profile picture, on every width: my profile, settings, admin (for
// an administrator only), the language and theme switches, and sign out. The Admin link is a convenience;
// the backend enforces the role.
@Component({
  selector: 'app-user-menu',
  imports: [RouterLink, Avatar, MenuRow, ShellPopover, ShellPreferences, Icon],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.css',
})
export class UserMenu {
  protected readonly icons = {
    logOut: LucideLogOut,
    settings: LucideSettings,
    shield: LucideShield,
    userRound: LucideUserRound,
  };

  private readonly router = inject(Router);
  private readonly sessionStore = inject(SessionStore);

  protected readonly text = inject(LanguageStore).text;
  protected readonly user = this.sessionStore.user;
  protected readonly isAdministrator = this.sessionStore.isAdministrator;
  protected readonly addresses = appAddresses;
  protected readonly avatarSize = AvatarSize.Small;

  // The menu disappears with the session, so it needs no closing; the visitor lands in the guest shell.
  async signOut(): Promise<void> {
    await this.sessionStore.signOut();
    await this.router.navigateByUrl(appAddresses.home);
  }
}
