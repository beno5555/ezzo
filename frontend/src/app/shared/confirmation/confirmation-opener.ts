import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DialogOpener } from '../dialog/dialog-opener';
import { DialogRole } from '../dialog/dialog-role';
import { ConfirmationDialog } from './confirmation-dialog/confirmation-dialog';
import { ConfirmationQuestion } from './confirmation-question';

// Asks a question in a dialog with two buttons, and gives the answer to the caller, who awaits it:
//   const isConfirmed = await this.confirmationOpener.ask({ question, confirmButton, isDestructive: true });
// Escape and a click outside count as no. With typedWord set, the confirm button works only once that
// word is typed (deactivating one's own account types the username, deleting it a sentence that holds it).
@Injectable({ providedIn: 'root' })
export class ConfirmationOpener {
  private readonly dialogOpener = inject(DialogOpener);

  async ask(confirmation: ConfirmationQuestion): Promise<boolean> {
    const dialogRef = this.dialogOpener.open<boolean, ConfirmationQuestion, ConfirmationDialog>(
      ConfirmationDialog,
      confirmation,
      DialogRole.AlertDialog,
    );
    // The CDK speaks RxJS; this turns its one closing event into the promise the conventions use.
    const result = await firstValueFrom(dialogRef.closed, { defaultValue: undefined });

    return result === true;
  }
}
