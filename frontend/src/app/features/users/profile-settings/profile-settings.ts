import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { map } from 'rxjs';
import { DateFormatter } from '../../../core/languages/date-formatter';
import { LanguageStore } from '../../../core/languages/language-store';
import { LIMITS } from '../../../core/limits';
import { SessionStore } from '../../../core/session/session-store';
import { Button } from '../../../shared/button/button';
import { applyFieldErrors, setServerErrors } from '../../../shared/form-field/apply-field-errors';
import { FieldRules } from '../../../shared/form-field/field-rules';
import { FormField } from '../../../shared/form-field/form-field';
import { FormMessage } from '../../../shared/form-message/form-message';
import { TextInput } from '../../../shared/text-input/text-input';
import { ToastStore } from '../../../shared/toasts/toast-store';
import { MinuteClock } from '../../../core/time/minute-clock';
import { bioOrNull } from '../bio-or-null';
import { EditUserDto } from '../edit-user-dto';
import { FullUserDto } from '../full-user-dto';
import { SettingsSection } from '../settings-section/settings-section';
import { toProfileFormValue } from '../to-profile-form-value';
import { UserApi } from '../user-api';
import { userRefusalField } from '../user-refusal-field';
import { usernameChangeOpensAt } from '../username-change-opens-at';

// The profile section of the settings page: the account's creation date, read-only, and a form for the
// username, the date of birth and the bio. Under the username stand the 20-day rule, when it was last
// changed and when it can change again. The server's refusal of a username (taken, reserved, changed too
// soon) shows beside the field. A changed username makes the session read the new one: the access token
// carries the username, and a refresh issues one that holds the stored name. It hands the saved profile
// to the page, which keeps it for the cooldown lines and for the confirmation words of the danger zone.
@Component({
  selector: 'app-profile-settings',
  imports: [ReactiveFormsModule, Button, FormField, FormMessage, SettingsSection, TextInput],
  templateUrl: './profile-settings.html',
  styleUrl: './profile-settings.css',
})
export class ProfileSettings implements OnInit {
  private readonly userApi = inject(UserApi);
  private readonly sessionStore = inject(SessionStore);
  private readonly toastStore = inject(ToastStore);
  private readonly minuteClock = inject(MinuteClock);

  protected readonly text = inject(LanguageStore).text;
  protected readonly dates = inject(DateFormatter);
  protected readonly limits = LIMITS.users;

  readonly profile = input.required<FullUserDto>();
  readonly saved = output<FullUserDto>();

  protected readonly form = inject(NonNullableFormBuilder).group({
    username: ['', FieldRules.username],
    dateOfBirth: ['', FieldRules.dateOfBirth],
    bio: ['', FieldRules.bio],
  });
  // The bio stops taking characters at its limit and shows the count beside its label.
  protected readonly written = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );
  protected readonly isSubmitting = signal(false);
  protected readonly failureMessage = signal<string | null>(null);

  // The username's hint: its characters, then the rule, then when it was last changed and when it can
  // change again, in one paragraph that screen readers read after the field's label.
  protected readonly usernameHint = computed(() => {
    const hints = this.text().users.settings.profile;
    const lastChangedAt = this.profile().usernameLastChangedAt;
    const characters = this.text().auth.register.usernameHint(
      this.limits.usernameMinLength,
      this.limits.usernameMaxLength,
    );
    const rule = hints.usernameRule(this.limits.usernameChangeCooldownDays);

    return [characters, rule, ...this.changeLines(lastChangedAt)].join(' ');
  });

  ngOnInit(): void {
    this.form.setValue(toProfileFormValue(this.profile()));
  }

  async save(): Promise<void> {
    if (this.form.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.failureMessage.set(null);
    const previousUsername = this.profile().username;
    const result = await this.userApi.editMine(this.toEditDto());

    if (result.succeeded) {
      await this.finishSave(previousUsername, result.data);
      return;
    }

    this.isSubmitting.set(false);
    const refusedField = userRefusalField(result.message);
    if (refusedField === 'username') {
      setServerErrors(this.form.controls.username, [result.message]);
      return;
    }

    applyFieldErrors(this.form, result.fieldErrors);
    this.failureMessage.set(result.message);
  }

  private async finishSave(previousUsername: string, saved: FullUserDto): Promise<void> {
    const hasNewUsername = saved.username !== previousUsername;

    // The form shows the profile as stored (the backend keeps usernames in lower case).
    this.form.setValue(toProfileFormValue(saved));
    this.form.markAsPristine();
    if (hasNewUsername) {
      await this.sessionStore.refresh();
    }
    this.saved.emit(saved);
    this.isSubmitting.set(false);
    this.toastStore.show(this.text().users.settings.profile.savedToast);
  }

  // What the page says about the username's changes: never changed, or when it was last changed and when
  // it can change again (or that it can now).
  private changeLines(lastChangedAt: string | null): string[] {
    const hints = this.text().users.settings.profile;
    let lines = [hints.usernameNeverChanged];

    if (lastChangedAt !== null) {
      const opensAt = usernameChangeOpensAt(lastChangedAt);
      const isOpen = Date.parse(opensAt) <= this.minuteClock.now();
      const next = isOpen
        ? hints.usernameChangeableNow
        : hints.usernameChangeableFrom(this.dates.date(opensAt));

      lines = [hints.usernameLastChanged(this.dates.date(lastChangedAt)), next];
    }

    return lines;
  }

  private toEditDto(): EditUserDto {
    const { bio, ...profile } = this.form.getRawValue();

    return { ...profile, bio: bioOrNull(bio) };
  }
}
