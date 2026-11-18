import { DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { LanguageStore } from '../../core/languages/language-store';
import { Button } from '../../shared/button/button';
import { DialogFrame } from '../../shared/dialog/dialog-frame/dialog-frame';
import { TextInput } from '../../shared/text-input/text-input';

// A dialog with some content, an input and two buttons, to prove that the focus stays inside.
@Component({
  imports: [DialogFrame, Button, TextInput],
  selector: 'app-sample-dialog',
  templateUrl: './sample-dialog.html',
  styleUrl: './sample-dialog.css',
})
export class SampleDialog {
  private readonly dialogRef = inject(DialogRef);

  protected readonly text = inject(LanguageStore).text;

  close(): void {
    this.dialogRef.close();
  }
}
