import { Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { LucideCircleExclamationPoint } from '@lucide/angular';
import { switchMap } from 'rxjs';
import { LanguageStore } from '../../core/languages/language-store';
import { CharacterCounter } from '../character-counter/character-counter';
import { fieldErrorMessage } from './field-error-message';

// One field of a form (DESIGN.md, Inputs): the visible label above, the control the caller puts inside,
// an optional hint, and the field's error in danger with an icon, shown once the field was touched.
//   <app-form-field fieldId="email" [label]="text().auth.emailLabel" [control]="form.controls.email">
//     <input appTextInput id="email" type="email" formControlName="email" />
//   </app-form-field>
// The TextInput inside reads aria-invalid and aria-describedby from here. An element with the
// fieldAction attribute goes at the end of the label's row, such as a "Forgot password?" link.
@Component({
  selector: 'app-form-field',
  imports: [CharacterCounter, LucideCircleExclamationPoint],
  templateUrl: './form-field.html',
  styleUrl: './form-field.css',
})
export class FormField {
  private readonly text = inject(LanguageStore).text;

  // The id of the control inside, which the label points at.
  readonly fieldId = input.required<string>();
  readonly label = input.required<string>();
  readonly control = input.required<AbstractControl>();
  readonly hint = input<string>();
  // With a maxLength, the label's row ends with a counter of the used characters, "12/500". The control
  // inside is given the same limit through its maxlength attribute, so it stops taking characters there.
  readonly length = input(0);
  readonly maxLength = input<number>();

  // A control's touched and error state are not signals, and this component redraws only when a signal
  // changes, so it follows the control's events and reads the state again after each one.
  private readonly lastEvent = toSignal(
    toObservable(this.control).pipe(switchMap((control) => control.events)),
  );

  readonly errorMessage = computed(() => {
    this.lastEvent();
    const control = this.control();
    const showsError = control.touched && control.invalid;

    return showsError
      ? fieldErrorMessage(control.errors, this.text().shared.formField.errors)
      : null;
  });

  protected readonly hintId = computed(() => `${this.fieldId()}-hint`);
  protected readonly errorId = computed(() => `${this.fieldId()}-error`);

  // The ids the control's aria-describedby lists: the hint, then the error while one shows.
  readonly describedBy = computed(() => {
    const ids = [
      this.hint() === undefined ? null : this.hintId(),
      this.errorMessage() === null ? null : this.errorId(),
    ].filter((id) => id !== null);

    return ids.length === 0 ? null : ids.join(' ');
  });
}
