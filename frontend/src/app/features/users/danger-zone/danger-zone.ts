import { Component, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AppResult } from '../../../core/http/app-result';
import { LanguageStore } from '../../../core/languages/language-store';
import { appAddresses } from '../../../core/routing/app-addresses';
import { SessionStore } from '../../../core/session/session-store';
import { Button } from '../../../shared/button/button';
import { ConfirmationOpener } from '../../../shared/confirmation/confirmation-opener';
import { ToastStore } from '../../../shared/toasts/toast-store';
import { AccountActivationApi } from '../../accounts/account-activation-api';
import { AccountManagementApi } from '../../accounts/account-management-api';
import { LandingPageState } from '../../auth/landing-page/landing-page-state';
import { SignInNotice } from '../../auth/landing-page/sign-in-notice';
import { SettingsSection } from '../settings-section/settings-section';

// What the confirmation asks, from one of the danger zone's dictionary entries.
type LeavingTexts = { question: string; detail: string; confirmButton: string };

// The danger zone of the settings page: deactivate and delete the user's own account. Each opens a typed
// confirmation: deactivating asks for the username, which is enough since an email link undoes it;
// deleting asks for a sentence that holds the username, since the user cannot undo it. Once the backend
// has done it, each ends the same way: the session ends, and the user lands on the sign-in page, whose notice says what happens next (a
// deactivated account is reactivated by email; a deleted one is removed after the retention period). A
// refusal is a toast, since the buttons are not a form.
@Component({
  selector: 'app-danger-zone',
  imports: [Button, SettingsSection],
  templateUrl: './danger-zone.html',
  styleUrl: './danger-zone.css',
})
export class DangerZone {
  private readonly activationApi = inject(AccountActivationApi);
  private readonly managementApi = inject(AccountManagementApi);
  private readonly confirmationOpener = inject(ConfirmationOpener);
  private readonly sessionStore = inject(SessionStore);
  private readonly toastStore = inject(ToastStore);
  private readonly router = inject(Router);

  protected readonly text = inject(LanguageStore).text;

  // The user's current username, which both confirmations ask for.
  readonly username = input.required<string>();

  protected readonly isBusy = signal(false);

  async deactivate(): Promise<void> {
    await this.leave(
      this.text().users.settings.dangerZone.deactivate,
      this.username(),
      () => this.activationApi.deactivateOwnAccount(),
      SignInNotice.AccountDeactivated,
    );
  }

  async deleteAccount(): Promise<void> {
    const texts = this.text().users.settings.dangerZone.delete;

    await this.leave(
      texts,
      texts.typedSentence(this.username()),
      () => this.managementApi.deleteOwnAccount(),
      SignInNotice.AccountDeleted,
    );
  }

  private async leave(
    texts: LeavingTexts,
    typedWord: string,
    request: () => Promise<AppResult<void>>,
    notice: SignInNotice,
  ): Promise<void> {
    if (this.isBusy()) {
      return;
    }

    const isConfirmed = await this.confirmationOpener.ask({
      question: texts.question,
      detail: texts.detail,
      confirmButton: texts.confirmButton,
      isDestructive: true,
      typedWord,
    });
    if (!isConfirmed) {
      return;
    }

    this.isBusy.set(true);
    const result = await request();

    if (result.succeeded) {
      // The backend has revoked the refresh tokens; this ends the session in this tab and tells the hub.
      await this.sessionStore.signOut();
      const state: LandingPageState = { notice };
      await this.router.navigateByUrl(appAddresses.home, { state });
      return;
    }

    this.isBusy.set(false);
    this.toastStore.show(result.message);
  }
}
