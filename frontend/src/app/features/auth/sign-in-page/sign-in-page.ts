import { Component, computed, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LanguageStore } from '../../../core/languages/language-store';
import { LIMITS } from '../../../core/limits';
import { appAddresses } from '../../../core/routing/app-addresses';
import { toReturnAddress } from '../../../core/routing/to-return-address';
import { SessionStore } from '../../../core/session/session-store';
import { FieldRules } from '../../../shared/form-field/field-rules';
import { Button } from '../../../shared/button/button';
import { applyFieldErrors } from '../../../shared/form-field/apply-field-errors';
import { FormField } from '../../../shared/form-field/form-field';
import { FormMessage } from '../../../shared/form-message/form-message';
import { TextInput } from '../../../shared/text-input/text-input';
import { TextLink } from '../../../shared/text-link/text-link';
import { AuthFrame } from '../auth-frame/auth-frame';
import { AuthLink } from '../auth-frame/auth-link';
import { toSignInPageState } from './sign-in-page-state';

// The sign-in page. One field takes a username or an email (LoginDto). On success it returns the user to
// the address a guard turned them away from. The form is the pattern every later form copies: a typed
// reactive form, validators from LIMITS, errors once a field was touched, the submit button disabled
// while the form is invalid, the server's field errors on their controls and its message above submit.
@Component({
  selector: 'app-sign-in-page',
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
  templateUrl: './sign-in-page.html',
  styleUrl: './sign-in-page.css',
})
export class SignInPage {
  private readonly sessionStore = inject(SessionStore);
  private readonly router = inject(Router);

  protected readonly text = inject(LanguageStore).text;
  protected readonly addresses = appAddresses;

  // The address a guard turned the user away from, from the query string.
  readonly returnUrl = input<string>();

  // Read while the navigation that opened this page is still current.
  private readonly pageState = toSignInPageState(this.router.currentNavigation()?.extras.state);

  protected readonly form = inject(NonNullableFormBuilder).group({
    uniqueIdentifier: [
      this.pageState.identifier ?? '',
      [Validators.required, Validators.maxLength(LIMITS.users.usernameMaxLength)],
    ],
    password: ['', FieldRules.password],
  });
  protected readonly isSubmitting = signal(false);
  protected readonly failureMessage = signal<string | null>(null);
  protected readonly noticeMessage = computed(() => {
    const notice = this.pageState.notice;
    return notice === undefined ? null : this.text().auth.signIn.notices[notice];
  });

  async signIn(): Promise<void> {
    if (this.form.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.failureMessage.set(null);
    const result = await this.sessionStore.signIn(this.form.getRawValue());
    this.isSubmitting.set(false);

    if (result.succeeded) {
      await this.router.navigateByUrl(toReturnAddress(this.returnUrl()));
      return;
    }

    applyFieldErrors(this.form, result.fieldErrors);
    this.failureMessage.set(result.message);
  }
}
