import { HttpStatusCode } from '@angular/common/http';
import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { LanguageStore } from '../../../core/languages/language-store';
import { NotFoundPage } from '../../../core/not-found/not-found-page';
import { LoadFailure } from '../../../shared/load-failure/load-failure';
import { StandardUserDto } from '../standard-user-dto';
import { UserApi } from '../user-api';
import { ProfileView } from '../profile-view/profile-view';
import { ProfilePageStatus } from './profile-page-status';

// A user's page at /users/:username, for a guest too. It reads the user by the name in the address and
// hands the profile to ProfileView. A username the backend does not find, which includes deactivated and
// deleted accounts, shows the not-found page at the same address. The username can change while the page
// stays open (a friend's link on a profile), so the page loads in an effect; each load starts by leaving
// the loading state, which drops the old profile's view and everything it held (its tab, its lists, its
// friendship buttons), so the next profile starts clean.
@Component({
  selector: 'app-profile-page',
  imports: [LoadFailure, NotFoundPage, ProfileView],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})
export class ProfilePage {
  private readonly userApi = inject(UserApi);

  // From the route, the address's last segment (withComponentInputBinding).
  readonly username = input.required<string>();

  protected readonly text = inject(LanguageStore).text;
  protected readonly ProfilePageStatus = ProfilePageStatus;
  protected readonly status = signal<ProfilePageStatus>(ProfilePageStatus.Loading);
  protected readonly user = signal<StandardUserDto | null>(null);
  protected readonly failureMessage = signal<string | null>(null);

  constructor() {
    effect(() => {
      const username = this.username();

      untracked(() => {
        void this.load(username);
      });
    });
  }

  async retry(): Promise<void> {
    await this.load(this.username());
  }

  private async load(username: string): Promise<void> {
    this.status.set(ProfilePageStatus.Loading);
    this.user.set(null);
    const result = await this.userApi.getByUsername(username);
    const isStillWanted = this.username() === username;

    if (isStillWanted) {
      if (result.succeeded) {
        this.user.set(result.data);
        this.status.set(ProfilePageStatus.Ready);
      } else if (result.status === HttpStatusCode.NotFound) {
        this.status.set(ProfilePageStatus.NotFound);
      } else {
        this.failureMessage.set(result.message);
        this.status.set(ProfilePageStatus.Failed);
      }
    }
  }
}
