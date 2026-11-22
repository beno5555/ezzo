import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { map } from 'rxjs';
import { LanguageStore } from '../../../core/languages/language-store';
import { LIMITS } from '../../../core/limits';
import { Button } from '../../../shared/button/button';
import { DialogFrame } from '../../../shared/dialog/dialog-frame/dialog-frame';
import { applyFieldErrors } from '../../../shared/form-field/apply-field-errors';
import { FormField } from '../../../shared/form-field/form-field';
import { FormMessage } from '../../../shared/form-message/form-message';
import { TextInput } from '../../../shared/text-input/text-input';
import { canSendReport } from '../can-send-report';
import { ReportApi } from '../report-api';
import { ReportTargetType } from '../report-target-type';
import { ReportDialogData } from './report-dialog-data';

// The dialog where a user reports a post or a comment, with a required reason. It closes with true once the
// server has the report, and with nothing when it is cancelled. A report the server refuses (one already
// pending, content that is gone) keeps the dialog open with the server's message and the reason as written.
// The text box stops taking characters at the limit (maxlength), and the Send button stays disabled until
// canSendReport holds.
@Component({
  selector: 'app-report-dialog',
  imports: [ReactiveFormsModule, Button, DialogFrame, FormField, FormMessage, TextInput],
  templateUrl: './report-dialog.html',
  styleUrl: './report-dialog.css',
})
export class ReportDialog {
  private readonly dialogRef = inject<DialogRef<boolean>>(DialogRef);
  private readonly reportApi = inject(ReportApi);
  private readonly target = inject<ReportDialogData>(DIALOG_DATA);

  protected readonly text = inject(LanguageStore).text;
  protected readonly maxLength = LIMITS.reports.reasonMaxLength;
  protected readonly title = computed(() => {
    const labels = this.text().reports.dialog;
    const isPost = this.target.targetType === ReportTargetType.Post;

    return isPost ? labels.postTitle : labels.commentTitle;
  });

  protected readonly form = inject(NonNullableFormBuilder).group({
    reason: ['', [Validators.maxLength(LIMITS.reports.reasonMaxLength)]],
  });
  private readonly written = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue().reason)),
    { initialValue: this.form.getRawValue().reason },
  );
  protected readonly length = computed(() => this.written().length);
  protected readonly isSubmitting = signal(false);
  protected readonly failureMessage = signal<string | null>(null);
  protected readonly canSend = computed(
    () => canSendReport(this.written()) && !this.isSubmitting(),
  );

  async send(): Promise<void> {
    if (this.canSend()) {
      this.isSubmitting.set(true);
      this.failureMessage.set(null);
      const result = await this.reportApi.create({
        targetType: this.target.targetType,
        targetId: this.target.targetId,
        reason: this.written().trim(),
      });

      if (result.succeeded) {
        this.dialogRef.close(true);
      } else {
        this.isSubmitting.set(false);
        this.failureMessage.set(result.message);
        applyFieldErrors(this.form, result.fieldErrors);
      }
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
