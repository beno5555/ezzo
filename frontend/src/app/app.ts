import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { LanguageStore } from './core/languages/language-store';
import { LanguageSwitch } from './core/languages/language-switch/language-switch';
import { appAddresses } from './core/routing/app-addresses';
import { SessionStore } from './core/session/session-store';

@Component({
  imports: [RouterLink, RouterOutlet, LanguageSwitch],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  private readonly sessionStore = inject(SessionStore);

  protected readonly text = inject(LanguageStore).text;
  protected readonly user = this.sessionStore.user;
  protected readonly signInAddress = appAddresses.signIn;

  async signOut(): Promise<void> {
    await this.sessionStore.signOut();
    await this.router.navigateByUrl(appAddresses.home);
  }
}
