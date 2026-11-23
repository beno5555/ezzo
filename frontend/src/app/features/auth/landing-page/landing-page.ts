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
import { LogoMark } from '../../../shared/logo-mark/logo-mark';
import { TextInput } from '../../../shared/text-input/text-input';
import { TextLink } from '../../../shared/text-link/text-link';
import { AuthFrame } from '../auth-frame/auth-frame';
import { AuthLink } from '../auth-frame/auth-link';
import { LandingPicture } from './landing-picture/landing-picture';
import { toLandingPageState } from './landing-page-state';

// The landing page: what a guest sees at the home address. On a wide screen a picture of the app stands
// beside the sign-in form; below that there is only the form. One field takes a username or an email
// (LoginDto). On success it returns the user to the address a guard turned them away from. The form is the pattern every later form copies: a typed
// reactive form, validators from LIMITS, errors once a field was touched, the submit button disabled
// while the form is invalid, the server's field errors on their controls and its message above submit.
@Component({
  selector: 'app-landing-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthFrame,
    AuthLink,
    Button,
    FormField,
    FormMessage,
    LandingPicture,
    LogoMark,
    TextInput,
    TextLink,
  ],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css',
  host: { class: 'grid items-center gap-8 lg:grid-cols-2' },
})
export class LandingPage {
  private readonly sessionStore = inject(SessionStore);
  private readonly router = inject(Router);

  protected readonly text = inject(LanguageStore).text;
  protected readonly addresses = appAddresses;

  // The address a guard turned the user away from, from the query string.
  readonly returnUrl = input<string>();

  // Read while the navigation that opened this page is still current.
  private readonly pageState = toLandingPageState(this.router.currentNavigation()?.extras.state);

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
