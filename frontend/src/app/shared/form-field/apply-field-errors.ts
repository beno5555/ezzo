import { AbstractControl, FormGroup } from '@angular/forms';
import { FieldErrors } from '../../core/http/app-result';
import { serverErrorKey } from './field-error-message';

// After a failed submit: each of the server's field errors goes on the control of the same name, where
// the form field shows it. A field the form does not have is left out; the page's general message
// above the submit button still tells the user that something was refused.
export function applyFieldErrors(form: FormGroup, fieldErrors: FieldErrors | undefined): void {
  const entries = Object.entries(fieldErrors ?? {});

  for (const [field, messages] of entries) {
    const control = form.get(field);
    if (control !== null) {
      setServerErrors(control, messages);
    }
  }
}

// The server's messages on one control. They last until the control's value changes, because Angular
// runs the validators again then and replaces the errors with theirs.
export function setServerErrors(control: AbstractControl, messages: string[]): void {
  control.setErrors({ ...control.errors, [serverErrorKey]: messages });
  control.markAsTouched();
}
