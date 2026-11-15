import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LIMITS } from '../../../core/limits';
import { toReturnAddress } from '../../../core/routing/to-return-address';
import { SessionStore } from '../../../core/session/session-store';

// A bare form that proves the session in the running app. Ticket 08 replaces it with the real page.
@Component({
  selector: 'app-sign-in-page',
  imports: [ReactiveFormsModule],
  templateUrl: './sign-in-page.html',
  styleUrl: './sign-in-page.css',
})
export class SignInPage {
  private readonly sessionStore = inject(SessionStore);
  private readonly router = inject(Router);

  // The address a guard turned the user away from, from the query string.
  readonly returnUrl = input<string>();

  protected readonly form = inject(NonNullableFormBuilder).group({
    uniqueIdentifier: [
      '',
      [Validators.required, Validators.maxLength(LIMITS.users.usernameMaxLength)],
    ],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(LIMITS.users.passwordMinLength),
        Validators.maxLength(LIMITS.users.passwordMaxLength),
      ],
    ],
  });
  protected readonly isSubmitting = signal(false);
  protected readonly failureMessage = signal<string | null>(null);

  async signIn(): Promise<void> {
    if (this.form.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    const result = await this.sessionStore.signIn(this.form.getRawValue());
    this.isSubmitting.set(false);

    if (result.succeeded) {
      await this.router.navigateByUrl(toReturnAddress(this.returnUrl()));
      return;
    }

    this.failureMessage.set(result.message);
  }
}
