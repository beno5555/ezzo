import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DialogOpener } from '../../shared/dialog/dialog-opener';
import { ReportDialog } from './report-dialog/report-dialog';
import { ReportDialogData } from './report-dialog/report-dialog-data';
import { ReportTargetType } from './report-target-type';

// Opens the report dialog for a post or a comment and resolves once it has closed, sent or cancelled. The
// dialog itself shows the toast that says the report was received. The CDK speaks RxJS; this turns its one
// closing event into the promise the conventions use, as ConfirmationOpener does.
//   await this.reportOpener.report(ReportTargetType.Post, post.id);
@Injectable({ providedIn: 'root' })
export class ReportOpener {
  private readonly dialogOpener = inject(DialogOpener);

  async report(targetType: ReportTargetType, targetId: number): Promise<void> {
    const dialogRef = this.dialogOpener.open<boolean, ReportDialogData, ReportDialog>(
      ReportDialog,
      { targetType, targetId },
    );

    await firstValueFrom(dialogRef.closed, { defaultValue: undefined });
  }
}
