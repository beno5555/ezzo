import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DialogOpener } from '../../shared/dialog/dialog-opener';
import { AdminUserDto } from './admin-user-dto';
import { CreateAccountDialog } from './create-account-dialog/create-account-dialog';
import { EditProfileDialog } from './edit-profile-dialog/edit-profile-dialog';
import { EditProfileDialogData } from './edit-profile-dialog/edit-profile-dialog-data';

// Opens the two account dialogs and gives the page the row the administrator saved, or undefined when the
// dialog was closed without saving. The CDK speaks RxJS; this turns its one closing event into the
// promise the conventions use, as ConfirmationOpener does.
@Injectable({ providedIn: 'root' })
export class AccountDialogOpener {
  private readonly dialogOpener = inject(DialogOpener);

  async create(): Promise<AdminUserDto | undefined> {
    const dialogRef = this.dialogOpener.open<AdminUserDto, null, CreateAccountDialog>(
      CreateAccountDialog,
      null,
    );

    return await firstValueFrom(dialogRef.closed, { defaultValue: undefined });
  }

  async edit(account: AdminUserDto): Promise<AdminUserDto | undefined> {
    const dialogRef = this.dialogOpener.open<
      AdminUserDto,
      EditProfileDialogData,
      EditProfileDialog
    >(EditProfileDialog, { account });

    return await firstValueFrom(dialogRef.closed, { defaultValue: undefined });
  }
}
