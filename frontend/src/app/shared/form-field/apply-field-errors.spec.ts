import { FormControl, FormGroup, Validators } from '@angular/forms';
import { applyFieldErrors } from './apply-field-errors';
import { serverErrorKey } from './field-error-message';

function registerForm(): FormGroup<{ username: FormControl<string>; email: FormControl<string> }> {
  return new FormGroup({
    username: new FormControl('john_doe', { nonNullable: true, validators: Validators.required }),
    email: new FormControl('john@example.com', { nonNullable: true }),
  });
}

describe('applyFieldErrors', () => {
  it("puts the server's messages on the control of the same name and marks it touched", () => {
    const form = registerForm();

    applyFieldErrors(form, { username: ['Username is already taken'] });

    const username = form.controls.username;
    expect(username.errors).toEqual({ [serverErrorKey]: ['Username is already taken'] });
    expect(username.touched).toBe(true);
    expect(form.controls.email.errors).toBeNull();
  });

  it('leaves the form alone for a field it does not have', () => {
    const form = registerForm();

    applyFieldErrors(form, { $: ['The JSON value could not be converted.'] });

    expect(form.valid).toBe(true);
  });

  it("drops the server's message once the user changes the field", () => {
    const form = registerForm();
    applyFieldErrors(form, { username: ['Username is already taken'] });

    form.controls.username.setValue('john_doe_2');

    expect(form.controls.username.errors).toBeNull();
  });

  it('does nothing when the failure carries no field errors', () => {
    const form = registerForm();

    applyFieldErrors(form, undefined);

    expect(form.valid).toBe(true);
  });
});
