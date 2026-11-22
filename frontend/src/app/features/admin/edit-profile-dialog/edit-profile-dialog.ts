import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LanguageStore } from '../../../core/languages/language-store';
import { LIMITS } from '../../../core/limits';
import { Button } from '../../../shared/button/button';
import { DialogFrame } from '../../../shared/dialog/dialog-frame/dialog-frame';
import { AppValidators } from '../../../shared/form-field/app-validators';
import { applyFieldErrors, setServerErrors } from '../../../shared/form-field/apply-field-errors';
import { FieldRules } from '../../../shared/form-field/field-rules';
import { FormField } from '../../../shared/form-field/form-field';
import { FormMessage } from '../../../shared/form-message/form-message';
import { LoadFailure } from '../../../shared/load-failure/load-failure';
import { TextInput } from '../../../shared/text-input/text-input';
import { EditUserDto } from '../../users/edit-user-dto';
import { toDateInputValue } from '../../users/to-date-input-value';
import { UserApi } from '../../users/user-api';
import { userRefusalField } from '../../users/user-refusal-field';
import { AdminUserDto } from '../admin-user-dto';
import { EditProfileDialogData } from './edit-profile-dialog-data';

// The dialog where an administrator edits an account's profile (username, date of birth, bio). The
// account's row holds none of these but the username, so the dialog reads the profile first, and shows
// the form once it is there. It closes with the account's row, as the server stored the name, or with
// nothing when it is cancelled.
@Component({
  selector: 'app-edit-profile-dialog',
  imports: [
    ReactiveFormsModule,
    Button,
    DialogFrame,
    FormField,
    FormMessage,
    LoadFailure,
    TextInput,
  ],
  templateUrl: './edit-profile-dialog.html',
  styleUrl: './edit-profile-dialog.css',
})
export class EditProfileDialog implements OnInit {
  private readonly dialogRef = inject<DialogRef<AdminUserDto>>(DialogRef);
  private readonly userApi = inject(UserApi);
  private readonly account = inject<EditProfileDialogData>(DIALOG_DATA).account;

  protected readonly text = inject(LanguageStore).text;
  protected readonly limits = LIMITS.users;
  protected readonly username = this.account.username;

  protected readonly form = inject(NonNullableFormBuilder).group({
    username: ['', FieldRules.username],
    dateOfBirth: [
      '',
      [Validators.required, AppValidators.ageBetween(LIMITS.users.minAge, LIMITS.users.maxAge)],
    ],
    bio: ['', [Validators.maxLength(LIMITS.users.bioMaxLength)]],
  });
  // The profile has been read and the form holds it. The server's text of a failed read is kept to show.
  protected readonly isLoaded = signal(false);
  protected readonly loadFailureMessage = signal<string | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly failureMessage = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  // On opening, and from the Try again button after a failed read.
  async load(): Promise<void> {
    this.loadFailureMessage.set(null);
    const result = await this.userApi.getById(this.account.id);

    if (result.succeeded) {
      this.form.setValue({
        username: result.data.username,
        dateOfBirth: toDateInputValue(result.data.dateOfBirth),
        bio: result.data.bio ?? '',
      });
      this.isLoaded.set(true);
      return;
    }

    this.loadFailureMessage.set(result.message);
  }

  async save(): Promise<void> {
    if (this.form.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.failureMessage.set(null);
    const result = await this.userApi.edit(this.account.id, this.toEditDto());

    if (result.succeeded) {
      this.dialogRef.close({ ...this.account, username: result.data.username });
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

  cancel(): void {
    this.dialogRef.close();
  }

  // An empty bio is sent as none, since the backend refuses an empty one.
  private toEditDto(): EditUserDto {
    const { bio, ...profile } = this.form.getRawValue();
    const hasBio = bio.trim() !== '';

    return { ...profile, bio: hasBio ? bio : null };
  }
}
