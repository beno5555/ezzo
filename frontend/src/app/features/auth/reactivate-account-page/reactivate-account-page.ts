import { DOCUMENT, Component, computed, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LanguageStore } from '../../../core/languages/language-store';
import { appAddresses } from '../../../core/routing/app-addresses';
import { FieldRules } from '../../../shared/form-field/field-rules';
import { Button } from '../../../shared/button/button';
import { applyFieldErrors } from '../../../shared/form-field/apply-field-errors';
import { FormField } from '../../../shared/form-field/form-field';
import { FormMessage } from '../../../shared/form-message/form-message';
import { TextInput } from '../../../shared/text-input/text-input';
import { TextLink } from '../../../shared/text-link/text-link';
import { AccountActivationApi } from '../../accounts/account-activation-api';
import { AuthFrame } from '../auth-frame/auth-frame';
import { AuthLink } from '../auth-frame/auth-link';
import { SignInNotice } from '../landing-page/sign-in-notice';
import { LandingPageState } from '../landing-page/landing-page-state';

// The reactivation page, in two states (spec, Auth pages). Without a token it asks for the email and sends
// this page as the return address, so the email holds a link back here with ?token=…. Opened from that
// link, it shows one button and reactivates only when it is pressed: mail services open every link in an
// email to scan it, and reactivating on load would use up the token before the person reads the email.
// Success leads to sign-in with a message.
@Component({
  selector: 'app-reactivate-account-page',
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
  templateUrl: './reactivate-account-page.html',
  styleUrl: './reactivate-account-page.css',
})
export class ReactivateAccountPage {
  private readonly activationApi = inject(AccountActivationApi);
  private readonly router = inject(Router);
  private readonly origin = inject(DOCUMENT).location.origin;

  protected readonly text = inject(LanguageStore).text;
  protected readonly addresses = appAddresses;

  // The token the email's link carries, from the query string.
  readonly token = input<string>();

  private readonly tokenOrEmpty = computed(() => this.token() ?? '');
  protected readonly hasToken = computed(() => this.tokenOrEmpty() !== '');
  protected readonly lead = computed(() =>
    this.hasToken() ? this.text().auth.reactivate.linkLead : this.text().auth.reactivate.lead,
  );

  protected readonly emailForm = inject(NonNullableFormBuilder).group({
    email: ['', FieldRules.email],
  });
  // The address the link went to, once it was sent.
  protected readonly sentTo = signal<string | null>(null);
  protected readonly isSubmitting = signal(false);
  // One message per state, so a dead link's message does not follow the user to the request form.
  protected readonly requestFailureMessage = signal<string | null>(null);
  protected readonly activationFailureMessage = signal<string | null>(null);

  async sendLink(): Promise<void> {
    if (this.emailForm.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.requestFailureMessage.set(null);
    const { email } = this.emailForm.getRawValue();
    const redirectUrl = this.origin + appAddresses.reactivateAccount;
    const result = await this.activationApi.requestActivation({ email, redirectUrl });
    this.isSubmitting.set(false);

    if (result.succeeded) {
      this.sentTo.set(email);
      return;
    }

    applyFieldErrors(this.emailForm, result.fieldErrors);
    this.requestFailureMessage.set(result.message);
  }

  async reactivate(): Promise<void> {
    if (this.isSubmitting() || !this.hasToken()) {
      return;
    }

    this.isSubmitting.set(true);
    this.activationFailureMessage.set(null);
    const result = await this.activationApi.activate(this.tokenOrEmpty());

    if (result.succeeded) {
      const state: LandingPageState = { notice: SignInNotice.AccountReactivated };
      await this.router.navigateByUrl(appAddresses.home, { state });
      return;
    }

    this.isSubmitting.set(false);
    this.activationFailureMessage.set(result.message);
  }
}
