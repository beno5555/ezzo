import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LanguageStore } from '../../core/languages/language-store';
import { DialogOpener } from '../../shared/dialog/dialog-opener';
import { ToastStore } from '../../shared/toasts/toast-store';
import { ReportDialog } from './report-dialog/report-dialog';
import { ReportDialogData } from './report-dialog/report-dialog-data';
import { ReportTargetType } from './report-target-type';

// Opens the report dialog for a post or a comment, and shows the toast that says the report was received
// once the dialog has sent it, so the user does not send it twice. Nothing is shown when the dialog is
// cancelled. The CDK speaks RxJS; this turns its one closing event into the promise the conventions use,
// as ConfirmationOpener does.
//   await this.reportOpener.report(ReportTargetType.Post, post.id);
@Injectable({ providedIn: 'root' })
export class ReportOpener {
  private readonly dialogOpener = inject(DialogOpener);
  private readonly toastStore = inject(ToastStore);
  private readonly text = inject(LanguageStore).text;

  async report(targetType: ReportTargetType, targetId: number): Promise<void> {
    const dialogRef = this.dialogOpener.open<boolean, ReportDialogData, ReportDialog>(
      ReportDialog,
      { targetType, targetId },
    );
    const isSent = await firstValueFrom(dialogRef.closed, { defaultValue: undefined });

    if (isSent === true) {
      this.toastStore.show(this.text().reports.sentToast);
    }
  }
}
