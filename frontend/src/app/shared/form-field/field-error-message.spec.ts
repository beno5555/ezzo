import { english } from '../../core/languages/english';
import { fieldErrorMessage, serverErrorKey } from './field-error-message';

const texts = english.shared.formField.errors;

describe('fieldErrorMessage', () => {
  it('shows nothing for a control without errors', () => {
    expect(fieldErrorMessage(null, texts)).toBeNull();
  });

  it('asks for a value when a required field is empty', () => {
    expect(fieldErrorMessage({ required: true }, texts)).toBe('Fill in this field.');
  });

  it('names the shortest length the field accepts', () => {
    const errors = { minlength: { requiredLength: 6, actualLength: 2 } };

    expect(fieldErrorMessage(errors, texts)).toBe('Use at least 6 characters.');
  });

  it('names the longest length the field accepts', () => {
    const errors = { maxlength: { requiredLength: 100, actualLength: 101 } };

    expect(fieldErrorMessage(errors, texts)).toBe('Use at most 100 characters.');
  });

  it("shows the server's message as it arrives, before any check of the browser's", () => {
    const errors = { required: true, [serverErrorKey]: ['Username is already taken'] };

    expect(fieldErrorMessage(errors, texts)).toBe('Username is already taken');
  });

  it("joins the server's messages when it sends more than one", () => {
    const errors = { [serverErrorKey]: ['Too short.', 'Not allowed.'] };

    expect(fieldErrorMessage(errors, texts)).toBe('Too short. Not allowed.');
  });

  it('says which characters a username may use', () => {
    expect(fieldErrorMessage({ usernameCharacters: true }, texts)).toBe(
      'Use letters, digits, _ and -, with at least one letter.',
    );
  });

  it('asks for a whole email address', () => {
    expect(fieldErrorMessage({ emailFormat: true }, texts)).toBe(
      'Enter an email address, like name@example.com.',
    );
  });

  it('names the youngest age allowed', () => {
    expect(fieldErrorMessage({ tooYoung: { minAge: 13 } }, texts)).toBe(
      'You must be at least 13 years old.',
    );
  });

  it('names the oldest age allowed', () => {
    expect(fieldErrorMessage({ tooOld: { maxAge: 100 } }, texts)).toBe(
      'Enter an age of 100 years or less.',
    );
  });

  it('refuses a date of birth after today', () => {
    expect(fieldErrorMessage({ futureDate: true }, texts)).toBe(
      'The date of birth cannot be in the future.',
    );
  });

  it('falls back to a general text for an error it has no words for', () => {
    expect(fieldErrorMessage({ somethingElse: true }, texts)).toBe('This value is not valid.');
  });
});
