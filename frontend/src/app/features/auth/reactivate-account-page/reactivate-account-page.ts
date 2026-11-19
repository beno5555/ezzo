import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { SignInNotice } from '../sign-in-page/sign-in-notice';
import { SignInPageState } from '../sign-in-page/sign-in-page-state';

// The reactivation page: one page, two steps (spec, Auth pages). The email first, which sends a code to
// it; then the code. Success leads to sign-in with a message and the email filled in, since sign-in
// takes an email as well as a username.
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
  private readonly formBuilder = inject(NonNullableFormBuilder);

  protected readonly text = inject(LanguageStore).text;
  protected readonly addresses = appAddresses;

  protected readonly emailForm = this.formBuilder.group({
    email: ['', FieldRules.email],
  });
  protected readonly codeForm = this.formBuilder.group({
    code: ['', [Validators.required]],
  });
  // The address the code went to; null while the page is on its first step.
  protected readonly sentTo = signal<string | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly failureMessage = signal<string | null>(null);

  async sendCode(): Promise<void> {
    if (this.emailForm.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.failureMessage.set(null);
    const { email } = this.emailForm.getRawValue();
    const result = await this.activationApi.requestActivation(email);
    this.isSubmitting.set(false);

    if (result.succeeded) {
      this.codeForm.reset();
      this.sentTo.set(email);
      return;
    }

    applyFieldErrors(this.emailForm, result.fieldErrors);
    this.failureMessage.set(result.message);
  }

  async reactivate(): Promise<void> {
    const email = this.sentTo();
    if (this.codeForm.invalid || this.isSubmitting() || email === null) {
      return;
    }

    this.isSubmitting.set(true);
    this.failureMessage.set(null);
    const code = this.codeForm.getRawValue().code.trim();
    const result = await this.activationApi.activate(code);

    if (result.succeeded) {
      const state: SignInPageState = {
        identifier: email,
        notice: SignInNotice.AccountReactivated,
      };
      await this.router.navigateByUrl(appAddresses.signIn, { state });
      return;
    }

    this.isSubmitting.set(false);
    this.failureMessage.set(result.message);
  }

  // Back to the first step, with the email kept for correcting.
  useAnotherEmail(): void {
    this.failureMessage.set(null);
    this.sentTo.set(null);
  }
}
