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

  describe('shortTime', () => {
    // 18:30 on 15 November in Tbilisi.
    const now = new Date('2026-11-15T14:30:00Z');

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(now);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('writes only the clock time for a moment earlier today', () => {
      const dates = startFormatter('Asia/Tbilisi', Language.English);

      expect(withPlainSpaces(dates.shortTime('2026-11-15T05:10:00Z'))).toBe('9:10 AM');
    });

    it('counts today in the local time zone, not in UTC', () => {
      // 23:10 on 14 November in UTC, already the 15th in Tbilisi.
      const dates = startFormatter('Asia/Tbilisi', Language.English);

      expect(withPlainSpaces(dates.shortTime('2026-11-14T23:10:00Z'))).toBe('3:10 AM');
    });

    it('writes the day and the month for an earlier day this year', () => {
      const dates = startFormatter('Asia/Tbilisi', Language.English);

      expect(dates.shortTime('2026-03-02T10:00:00Z')).toBe('Mar 2');
    });

    it('adds the year for a moment in an earlier year', () => {
      const dates = startFormatter('Asia/Tbilisi', Language.English);

      expect(dates.shortTime('2025-12-31T10:00:00Z')).toBe('Dec 31, 2025');
    });

    it('writes a short time in Georgian', () => {
      const dates = startFormatter('Asia/Tbilisi', Language.Georgian);

      expect(dates.shortTime('2026-11-15T05:10:00Z')).toBe('09:10');
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
