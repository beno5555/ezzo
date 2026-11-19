import { Component, computed, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LanguageStore } from '../../../core/languages/language-store';
import { LIMITS } from '../../../core/limits';
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
import { SignInNotice } from '../sign-in-page/sign-in-notice';
import { SignInPageState } from '../sign-in-page/sign-in-page-state';

// The reset page the reset email links to, with ?token=…. It asks for the new password and, once the
// backend takes it, sends the user to sign in with it. A token the backend no longer accepts shows the
// backend's message; the link to ask for a new one is always below the form.
@Component({
  selector: 'app-reset-password-page',
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
  templateUrl: './reset-password-page.html',
  styleUrl: './reset-password-page.css',
})
export class ResetPasswordPage {
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);

  protected readonly text = inject(LanguageStore).text;
  protected readonly addresses = appAddresses;
  protected readonly limits = LIMITS.users;

  // The token the email's link carries, from the query string.
  readonly token = input<string>();

  private readonly tokenOrEmpty = computed(() => this.token() ?? '');
  protected readonly hasToken = computed(() => this.tokenOrEmpty() !== '');
  protected readonly form = inject(NonNullableFormBuilder).group({
    newPassword: ['', FieldRules.password],
  });
  protected readonly isSubmitting = signal(false);
  protected readonly failureMessage = signal<string | null>(null);

  async resetPassword(): Promise<void> {
    if (this.form.invalid || this.isSubmitting() || !this.hasToken()) {
      return;
    }

    this.isSubmitting.set(true);
    this.failureMessage.set(null);
    const { newPassword } = this.form.getRawValue();
    const result = await this.authApi.resetPassword({ token: this.tokenOrEmpty(), newPassword });

    if (result.succeeded) {
      const state: SignInPageState = { notice: SignInNotice.PasswordReset };
      await this.router.navigateByUrl(appAddresses.signIn, { state });
      return;
    }

    this.isSubmitting.set(false);
    applyFieldErrors(this.form, result.fieldErrors);
    this.failureMessage.set(result.message);
  }
}
