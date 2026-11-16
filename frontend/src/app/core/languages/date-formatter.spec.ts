import { TestBed } from '@angular/core/testing';
import { DateFormatter } from './date-formatter';
import { Language } from './language';
import { LanguageStore } from './language-store';

// ICU versions differ on the space before AM/PM (plain or narrow no-break), so compare plain spaces.
function withPlainSpaces(text: string): string {
  return text.replace(/\s/g, ' ');
}

describe('DateFormatter', () => {
  function startFormatter(timeZone: string, language: Language): DateFormatter {
    vi.stubEnv('TZ', timeZone);
    TestBed.inject(LanguageStore).setLanguage(language);
    return TestBed.inject(DateFormatter);
  }

  afterEach(() => {
    vi.unstubAllEnvs();
    localStorage.clear();
  });

  describe('time', () => {
    const sentAt = '2026-11-15T14:30:00Z';

    it('writes a time in English, in the local time zone', () => {
      const dates = startFormatter('Asia/Tbilisi', Language.English);

      expect(withPlainSpaces(dates.time(sentAt))).toBe('Nov 15, 2026, 6:30 PM');
    });

    it('writes a time in Georgian, in the local time zone', () => {
      const dates = startFormatter('Asia/Tbilisi', Language.Georgian);

      expect(dates.time(sentAt)).toBe('15 ნოე. 2026, 18:30');
    });

    it('follows a language switch', () => {
      const dates = startFormatter('Asia/Tbilisi', Language.English);

      TestBed.inject(LanguageStore).setLanguage(Language.Georgian);

      expect(dates.time(sentAt)).toBe('15 ნოე. 2026, 18:30');
    });
  });

  describe('dateOfBirth', () => {
    // Midnight UTC, which is still the evening before in Los Angeles.
    const dateOfBirth = '2000-03-01T00:00:00Z';

    it('is read west of UTC in these tests', () => {
      startFormatter('America/Los_Angeles', Language.English);

      expect(new Date(dateOfBirth).getDate()).toBe(29);
    });

    it('writes the calendar date in English, not the previous day', () => {
      const dates = startFormatter('America/Los_Angeles', Language.English);

      expect(dates.dateOfBirth(dateOfBirth)).toBe('March 1, 2000');
    });

    it('writes the calendar date in Georgian, not the previous day', () => {
      const dates = startFormatter('America/Los_Angeles', Language.Georgian);

      expect(dates.dateOfBirth(dateOfBirth)).toBe('1 მარტი, 2000');
    });
  });
});
