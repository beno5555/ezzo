import { DialogRef } from '@angular/cdk/dialog';
import { Component, inject, input } from '@angular/core';
import { LucideX } from '@lucide/angular';
import { LanguageStore } from '../../../core/languages/language-store';
import { IconButton } from '../../icon-button/icon-button';

// The look of every dialog: a raised box with the overlay shadow, its heading, a close button, and the
// content projected below. Only valid inside a dialog that DialogOpener opened, whose heading id it
// takes, so that the dialog is named by its heading:
//   <app-dialog-frame [title]="text().reports.dialogTitle">...content and buttons...</app-dialog-frame>
// A dialog whose own buttons answer it (a confirmation) leaves the close button out.
@Component({
  imports: [IconButton, LucideX],
  selector: 'app-dialog-frame',
  templateUrl: './dialog-frame.html',
  styleUrl: './dialog-frame.css',
})
export class DialogFrame {
  private readonly dialogRef = inject(DialogRef);

  protected readonly text = inject(LanguageStore).text;
  protected readonly titleId = this.dialogRef.config.ariaLabelledBy;

  readonly title = input.required<string>();
  readonly hasCloseButton = input(true);

  close(): void {
    this.dialogRef.close();
  }
}
