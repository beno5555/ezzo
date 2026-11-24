import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import LucideChartColumn from 'lucide/dist/esm/icons/chart-column.mjs';
import LucideFlag from 'lucide/dist/esm/icons/flag.mjs';
import LucideMenu from 'lucide/dist/esm/icons/menu.mjs';
import LucideScrollText from 'lucide/dist/esm/icons/scroll-text.mjs';
import LucideShieldCheck from 'lucide/dist/esm/icons/shield-check.mjs';
import LucideUsers from 'lucide/dist/esm/icons/users.mjs';
import { LanguageStore } from '../../../core/languages/language-store';
import { appAddresses } from '../../../core/routing/app-addresses';
import { Button } from '../../../shared/button/button';
import { Icon } from '../../../shared/icon/icon';
import { AdminNavLink } from './admin-nav-link';

// Wraps the admin panel's areas (users, reports, moderation, logs, statistics): a side navigation beside
// the area on a desktop, from 1024 px (DESIGN.md, Layout: the admin panel is a page with a real second
// column). Below that the navigation is folded away behind a button whose menu icon turns a quarter turn
// while the list is open, and the list closes again once an area is chosen. Each area is its own address;
// the routes' children fill the outlet.
@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterOutlet, AdminNavLink, Button, Icon],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayout {
  protected readonly icons = {
    chartColumn: LucideChartColumn,
    flag: LucideFlag,
    menu: LucideMenu,
    scrollText: LucideScrollText,
    shieldCheck: LucideShieldCheck,
    users: LucideUsers,
  };

  protected readonly text = inject(LanguageStore).text;
  protected readonly adminAddress = appAddresses.admin;
  protected readonly navigationId = 'admin-areas';
  protected readonly isNavigationOpen = signal(false);

  toggleNavigation(): void {
    this.isNavigationOpen.update((isOpen) => !isOpen);
  }

  closeNavigation(): void {
    this.isNavigationOpen.set(false);
  }
}
