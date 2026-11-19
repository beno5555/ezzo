import { DOCUMENT, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LanguageStore } from '../../../core/languages/language-store';
import { appAddresses } from '../../../core/routing/app-addresses';
import { FieldRules } from '../../../shared/form-field/field-rules';
import { Button } from '../../../shared/button/button';
import { applyFieldErrors } from '../../../shared/form-field/apply-field-errors';
import { FormField } from '../../../shared/form-field/form-field';
import { FormMessage } from '../../../shared/form-message/form-message';
import { TextInput } from '../../../shared/text-input/text-input';
import { TextLink } from '../../../shared/text-link/text-link';
import { AuthApi } from '../auth-api';
import { AuthFrame } from '../auth-frame/auth-frame';
import { AuthLink } from '../auth-frame/auth-link';

// The forgotten-password page. The request carries this app's own reset page as the return address, so
// the email holds a link to it (spec, Auth pages). The backend accepts the address only from an origin
// in Cors:AllowedOrigins. Once sent, the form gives way to a line that says where the link went.
@Component({
  selector: 'app-forgot-password-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthFrame,
    AuthLink,
    Button,
    FormField,
    FormMessage,
    TextInput,
    TextLink,
  ],
  templateUrl: './forgot-password-page.html',
  styleUrl: './forgot-password-page.css',
})
export class ForgotPasswordPage {
  private readonly authApi = inject(AuthApi);
  private readonly origin = inject(DOCUMENT).location.origin;

  protected readonly text = inject(LanguageStore).text;
  protected readonly addresses = appAddresses;

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', FieldRules.email],
  });
  protected readonly isSubmitting = signal(false);
  protected readonly failureMessage = signal<string | null>(null);
  // The address the link went to, once it was sent.
  protected readonly sentTo = signal<string | null>(null);

  async sendLink(): Promise<void> {
    if (this.form.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.failureMessage.set(null);
    const { email } = this.form.getRawValue();
    const redirectUrl = this.origin + appAddresses.resetPassword;
    const result = await this.authApi.requestPasswordReset({ email, redirectUrl });
    this.isSubmitting.set(false);

    if (result.succeeded) {
      this.sentTo.set(email);
      return;
    }

    applyFieldErrors(this.form, result.fieldErrors);
    this.failureMessage.set(result.message);
  }
}
