import { DOCUMENT, Component, inject, input, signal } from '@angular/core';
import { LanguageStore } from '../../../core/languages/language-store';
import { appAddresses } from '../../../core/routing/app-addresses';
import { Button } from '../../../shared/button/button';
import { FormMessage } from '../../../shared/form-message/form-message';
import { ToastStore } from '../../../shared/toasts/toast-store';
import { AuthApi } from '../../auth/auth-api';
import { SettingsSection } from '../settings-section/settings-section';

// The password section of the settings page. The backend has no change-password endpoint, so the button
// asks for the same reset email as the forgotten-password page, to the user's own address (spec,
// Settings). The email's link opens this app's reset page. A refused request is a toast, since the button
// is not a form.
@Component({
  selector: 'app-password-settings',
  imports: [Button, FormMessage, SettingsSection],
  templateUrl: './password-settings.html',
  styleUrl: './password-settings.css',
})
export class PasswordSettings {
  private readonly authApi = inject(AuthApi);
  private readonly toastStore = inject(ToastStore);
  private readonly origin = inject(DOCUMENT).location.origin;

  protected readonly text = inject(LanguageStore).text;

  // The user's own address, from their profile.
  readonly email = input.required<string>();

  protected readonly isSending = signal(false);
  // The address the link went to, once it was sent.
  protected readonly sentTo = signal<string | null>(null);

  async sendLink(): Promise<void> {
    if (this.isSending()) {
      return;
    }

    this.isSending.set(true);
    const email = this.email();
    const redirectUrl = this.origin + appAddresses.resetPassword;
    const result = await this.authApi.requestPasswordReset({ email, redirectUrl });
    this.isSending.set(false);

    if (result.succeeded) {
      this.sentTo.set(email);
      return;
    }

    this.toastStore.show(result.message);
  }
}
