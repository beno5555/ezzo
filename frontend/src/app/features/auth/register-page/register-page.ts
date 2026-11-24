import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LanguageStore } from '../../../core/languages/language-store';
import { LIMITS } from '../../../core/limits';
import { appAddresses } from '../../../core/routing/app-addresses';
import { SessionStore } from '../../../core/session/session-store';
import { FieldRules } from '../../../shared/form-field/field-rules';
import { Button } from '../../../shared/button/button';
import { AppValidators } from '../../../shared/form-field/app-validators';
import { applyFieldErrors, setServerErrors } from '../../../shared/form-field/apply-field-errors';
import { FormField } from '../../../shared/form-field/form-field';
import { FormMessage } from '../../../shared/form-message/form-message';
import { PasswordToggle } from '../../../shared/password-toggle/password-toggle';
import { TextInput } from '../../../shared/text-input/text-input';
import { TextLink } from '../../../shared/text-link/text-link';
import { bioOrNull } from '../../users/bio-or-null';
import { userRefusalField } from '../../users/user-refusal-field';
import { AuthApi } from '../auth-api';
import { AuthFrame } from '../auth-frame/auth-frame';
import { AuthLink } from '../auth-frame/auth-link';
import { RegisterDto } from '../register-dto';
import { SignInNotice } from '../landing-page/sign-in-notice';
import { LandingPageState } from '../landing-page/landing-page-state';

// The register page. The register endpoint hands out no session, so a successful registration signs in
// with the same credentials and goes on to the feed (spec, Auth pages). If that sign-in fails, the user
// lands on sign-in with the username filled in.
@Component({
  selector: 'app-register-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthFrame,
    AuthLink,
    Button,
    FormField,
    FormMessage,
    PasswordToggle,
    TextInput,
    TextLink,
  ],
  templateUrl: './register-page.html',
  styleUrl: './register-page.css',
})
export class RegisterPage {
  private readonly authApi = inject(AuthApi);
  private readonly sessionStore = inject(SessionStore);
  private readonly router = inject(Router);

  protected readonly text = inject(LanguageStore).text;
  protected readonly addresses = appAddresses;
  protected readonly limits = LIMITS.users;

  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly password = this.formBuilder.control('', FieldRules.password);

  // The password typed a second time stays in the browser: the register endpoint takes one password.
  protected readonly form = this.formBuilder.group({
    username: ['', FieldRules.username],
    email: ['', FieldRules.email],
    password: this.password,
    confirmPassword: ['', [Validators.required, AppValidators.sameAs(this.password)]],
    dateOfBirth: ['', FieldRules.dateOfBirth],
    bio: ['', FieldRules.bio],
  });
  protected readonly isSubmitting = signal(false);
  protected readonly failureMessage = signal<string | null>(null);

  constructor() {
    // A change to the password can make the repeated one match, or stop matching.
    this.password.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.form.controls.confirmPassword.updateValueAndValidity();
    });
  }

  async register(): Promise<void> {
    if (this.form.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.failureMessage.set(null);
    const registration = this.toRegisterDto();
    const result = await this.authApi.register(registration);

    // The button stays disabled through the sign-in and the navigation that follow.
    if (result.succeeded) {
      await this.signInAsNewUser(registration);
      return;
    }

    this.isSubmitting.set(false);
    const refusedField = userRefusalField(result.message);
    if (refusedField !== null) {
      setServerErrors(this.form.controls[refusedField], [result.message]);
      return;
    }

    applyFieldErrors(this.form, result.fieldErrors);
    this.failureMessage.set(result.message);
  }

  private async signInAsNewUser({ username, password }: RegisterDto): Promise<void> {
    const result = await this.sessionStore.signIn({ uniqueIdentifier: username, password });

    if (result.succeeded) {
      await this.router.navigateByUrl(appAddresses.home);
      return;
    }

    const state: LandingPageState = { identifier: username, notice: SignInNotice.AccountCreated };
    await this.router.navigateByUrl(appAddresses.home, { state });
  }

  private toRegisterDto(): RegisterDto {
    const { username, email, password, dateOfBirth, bio } = this.form.getRawValue();

    return { username, email, password, dateOfBirth, bio: bioOrNull(bio) };
  }
}
