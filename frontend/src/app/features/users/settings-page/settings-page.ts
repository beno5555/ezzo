import { Component, OnInit, inject, signal } from '@angular/core';
import { LanguageStore } from '../../../core/languages/language-store';
import { LanguageSwitch } from '../../../core/languages/language-switch/language-switch';
import { BackLink } from '../../../shared/back-link/back-link';
import { LoadFailure } from '../../../shared/load-failure/load-failure';
import { DangerZone } from '../danger-zone/danger-zone';
import { FullUserDto } from '../full-user-dto';
import { PasswordSettings } from '../password-settings/password-settings';
import { ProfileSettings } from '../profile-settings/profile-settings';
import { SettingsSection } from '../settings-section/settings-section';
import { UserApi } from '../user-api';

// The settings page at /settings, for a signed-in user: one page in four sections, under a link back to the
// page the user came from. It reads the user's own profile first (the email, the joined date and the time
// the username was last changed come only from that read), and the sections show once it is there. The
// profile section hands back each saved profile, which the page keeps, so the danger zone asks for the
// username as it is now.
@Component({
  selector: 'app-settings-page',
  imports: [
    BackLink,
    DangerZone,
    LanguageSwitch,
    LoadFailure,
    PasswordSettings,
    ProfileSettings,
    SettingsSection,
  ],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.css',
})
export class SettingsPage implements OnInit {
  private readonly userApi = inject(UserApi);

  protected readonly text = inject(LanguageStore).text;
  protected readonly profile = signal<FullUserDto | null>(null);
  protected readonly loadFailureMessage = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  // On opening, and from the Try again button after a failed read.
  async load(): Promise<void> {
    this.loadFailureMessage.set(null);
    const result = await this.userApi.getMine();

    if (result.succeeded) {
      this.profile.set(result.data);
      return;
    }

    this.loadFailureMessage.set(result.message);
  }

  protected keep(saved: FullUserDto): void {
    this.profile.set(saved);
  }
}
