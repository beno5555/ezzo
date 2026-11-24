import { DialogRef } from '@angular/cdk/dialog';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { LanguageStore } from '../../../core/languages/language-store';
import { LIMITS } from '../../../core/limits';
import { Button } from '../../../shared/button/button';
import { DialogFrame } from '../../../shared/dialog/dialog-frame/dialog-frame';
import { applyFieldErrors, setServerErrors } from '../../../shared/form-field/apply-field-errors';
import { FieldRules } from '../../../shared/form-field/field-rules';
import { FormField } from '../../../shared/form-field/form-field';
import { FormMessage } from '../../../shared/form-message/form-message';
import { TextInput } from '../../../shared/text-input/text-input';
import { RegisterDto } from '../../auth/register-dto';
import { bioOrNull } from '../../users/bio-or-null';
import { UserApi } from '../../users/user-api';
import { userRefusalField } from '../../users/user-refusal-field';
import { AdminUserDto } from '../admin-user-dto';
import { adminUserFromFull } from '../admin-user-from-full';

// The dialog where an administrator creates an account, with the fields of registration. It closes with
// the new account's row, or with nothing when it is cancelled. The new account is not signed in.
@Component({
  selector: 'app-create-account-dialog',
  imports: [ReactiveFormsModule, Button, DialogFrame, FormField, FormMessage, TextInput],
  templateUrl: './create-account-dialog.html',
  styleUrl: './create-account-dialog.css',
})
export class CreateAccountDialog {
  private readonly dialogRef = inject<DialogRef<AdminUserDto>>(DialogRef);
  private readonly userApi = inject(UserApi);

  protected readonly text = inject(LanguageStore).text;
  protected readonly limits = LIMITS.users;

  protected readonly form = inject(NonNullableFormBuilder).group({
    username: ['', FieldRules.username],
    email: ['', FieldRules.email],
    password: ['', FieldRules.password],
    dateOfBirth: ['', FieldRules.dateOfBirth],
    bio: ['', FieldRules.bio],
  });
  protected readonly isSubmitting = signal(false);
  protected readonly failureMessage = signal<string | null>(null);

  async create(): Promise<void> {
    if (this.form.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.failureMessage.set(null);
    const result = await this.userApi.create(this.toRegisterDto());

    if (result.succeeded) {
      this.dialogRef.close(adminUserFromFull(result.data));
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

  cancel(): void {
    this.dialogRef.close();
  }

  private toRegisterDto(): RegisterDto {
    const { bio, ...account } = this.form.getRawValue();

    return { ...account, bio: bioOrNull(bio) };
  }
}
