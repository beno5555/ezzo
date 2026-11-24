import { FormControl } from '@angular/forms';
import { AppValidators } from './app-validators';

describe('AppValidators', () => {
  describe('usernameCharacters', () => {
    it.each(['john_doe', 'jane-99', 'X'])('accepts %s', (username) => {
      expect(AppValidators.usernameCharacters(new FormControl(username))).toBeNull();
    });

    it.each(['1234', 'john doe', 'jöhn', '__'])('refuses %s', (username) => {
      expect(AppValidators.usernameCharacters(new FormControl(username))).toEqual({
        usernameCharacters: true,
      });
    });

    it('leaves an empty field to required', () => {
      expect(AppValidators.usernameCharacters(new FormControl(''))).toBeNull();
    });
  });

  describe('emailFormat', () => {
    it('accepts an address with a dot in its domain', () => {
      expect(AppValidators.emailFormat(new FormControl('john@example.com'))).toBeNull();
    });

    it.each(['john@', 'john@example', 'john doe@example.com'])('refuses %s', (email) => {
      expect(AppValidators.emailFormat(new FormControl(email))).toEqual({ emailFormat: true });
    });
  });

  describe('ageBetween', () => {
    const at = (isoTime: string) => AppValidators.ageBetween(13, 100, () => new Date(isoTime));
    const noon = '2026-11-19T12:00:00Z';

    it('accepts the day someone turns the minimum age', () => {
      expect(at(noon)(new FormControl('2013-11-19'))).toBeNull();
    });

    it('refuses the day before someone turns the minimum age', () => {
      expect(at(noon)(new FormControl('2013-11-20'))).toEqual({ tooYoung: { minAge: 13 } });
    });

    it('accepts someone of exactly the maximum age', () => {
      expect(at(noon)(new FormControl('1926-11-19'))).toBeNull();
    });

    it('refuses someone past the maximum age', () => {
      expect(at(noon)(new FormControl('1925-11-19'))).toEqual({ tooOld: { maxAge: 100 } });
    });

    it('refuses a date after today', () => {
      expect(at(noon)(new FormControl('2026-11-20'))).toEqual({ futureDate: true });
    });

    it('counts on the UTC calendar, as the backend does', () => {
      expect(at('2026-11-18T23:30:00Z')(new FormControl('2013-11-19'))).toEqual({
        tooYoung: { minAge: 13 },
      });
    });

    it('leaves an empty or unfinished date to required', () => {
      expect(at(noon)(new FormControl(''))).toBeNull();
    });
  });

  describe('sameAs', () => {
    const password = new FormControl('secret1', { nonNullable: true });
    const sameAsPassword = AppValidators.sameAs(password);

    it('accepts the same text', () => {
      expect(sameAsPassword(new FormControl('secret1'))).toBeNull();
    });

    it('refuses a different text', () => {
      expect(sameAsPassword(new FormControl('secret2'))).toEqual({ passwordMismatch: true });
    });

    it('leaves an empty field to required', () => {
      expect(sameAsPassword(new FormControl(''))).toBeNull();
    });
  });
});
