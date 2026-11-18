import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { LanguageStore } from '../../../core/languages/language-store';
import { ButtonLook } from '../../button/button-look';
import { Button } from '../../button/button';
import { DialogFrame } from '../../dialog/dialog-frame/dialog-frame';
import { TextInput } from '../../text-input/text-input';
import { ConfirmationQuestion } from '../confirmation-question';
import { isTypedWordMatch } from '../is-typed-word-match';

// The dialog that ConfirmationOpener opens. It closes with true on confirm and false on cancel; Escape
// and a click outside close it with nothing, which the opener reads as no. Cancel comes first, so it is
// where the keyboard focus lands, unless the typed variant puts the focus in its input.
@Component({
  imports: [ReactiveFormsModule, DialogFrame, Button, TextInput],
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.html',
  styleUrl: './confirmation-dialog.css',
})
export class ConfirmationDialog {
  private readonly dialogRef = inject<DialogRef<boolean>>(DialogRef);

  protected readonly text = inject(LanguageStore).text;
  protected readonly confirmation = inject<ConfirmationQuestion>(DIALOG_DATA);
  protected readonly typedWordInputId = 'confirmation-typed-word';
  protected readonly confirmLook = this.confirmation.isDestructive
    ? ButtonLook.Danger
    : ButtonLook.Primary;

  // Without a word to type the form is always valid, so the confirm button always works.
  protected readonly form = inject(NonNullableFormBuilder).group({
    typedWord: ['', [typedWordValidator(this.confirmation.typedWord)]],
  });

  confirm(): void {
    if (this.form.invalid) {
      return;
    }

    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}

function typedWordValidator(word: string | undefined): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const isMatched = word === undefined || isTypedWordMatch(control.value, word);

    return isMatched ? null : { typedWord: true };
  };
}
