import { TestBed } from '@angular/core/testing';
import { DateFormatter } from './date-formatter';
import { english } from './english';
import { georgian } from './georgian';
import { initialLanguage } from './initial-language';
import { Language } from './language';
import { LanguageStore } from './language-store';

// ICU versions differ on the space before AM/PM (plain or narrow no-break), so compare plain spaces.
function withPlainSpaces(text: string): string {
  return text.replace(/\s/g, ' ');
}

describe('DateFormatter', () => {
  function startFormatter(timeZone: string, language: Language): DateFormatter {
    vi.stubEnv('TZ', timeZone);
    const text = language === Language.Georgian ? georgian : english;
    TestBed.overrideProvider(initialLanguage, { useValue: { language, text } });
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

      expect(dates.time(sentAt)).toBe('15 ნოე, 2026, 18:30');
    });

    it('follows a language switch', async () => {
      const dates = startFormatter('Asia/Tbilisi', Language.English);

      await TestBed.inject(LanguageStore).setLanguage(Language.Georgian);

      expect(dates.time(sentAt)).toBe('15 ნოე, 2026, 18:30');
    });
  });

  describe('date', () => {
    it('writes the day of a moment with its year, in the local time zone', () => {
      const dates = startFormatter('Asia/Tbilisi', Language.English);

      expect(dates.date('2026-11-15T14:30:00Z')).toBe('Nov 15, 2026');
    });

    it('moves to the next day when the local time zone is already there', () => {
      const dates = startFormatter('Asia/Tbilisi', Language.English);

      expect(dates.date('2026-11-15T21:30:00Z')).toBe('Nov 16, 2026');
    });

    it('writes the date in Georgian', () => {
      const dates = startFormatter('Asia/Tbilisi', Language.Georgian);

      expect(dates.date('2026-11-15T14:30:00Z')).toBe('15 ნოე, 2026');
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

  describe('clockTime and day', () => {
    // 18:30 on 15 November in Tbilisi.
    const now = new Date('2026-11-15T14:30:00Z');

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(now);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('writes only the clock time, even for another day', () => {
      const dates = startFormatter('Asia/Tbilisi', Language.English);

      expect(withPlainSpaces(dates.clockTime('2026-10-02T05:10:00Z'))).toBe('9:10 AM');
    });

    it('says today and yesterday in the local time zone, and the date without the year before', () => {
      const dates = startFormatter('Asia/Tbilisi', Language.English);

      // 01:00 on the 15th in Tbilisi, still the 14th in UTC.
      expect(dates.day('2026-11-14T21:00:00Z')).toBe('Today');
      expect(dates.day('2026-11-14T10:00:00Z')).toBe('Yesterday');
      expect(dates.day('2026-11-02T10:00:00Z')).toBe('Nov 2');
      expect(dates.day('2025-11-02T10:00:00Z')).toBe('Nov 2');
    });

    it('writes Georgian', () => {
      const dates = startFormatter('Asia/Tbilisi', Language.Georgian);

      expect(dates.day('2026-11-15T10:00:00Z')).toBe('დღეს');
      expect(dates.day('2026-11-14T10:00:00Z')).toBe('გუშინ');
      expect(dates.day('2026-11-02T10:00:00Z')).toBe('2 ნოე');
      expect(dates.shortTime('2025-12-31T10:00:00Z')).toBe('31 დეკ, 2025');
    });
  });

  describe('timeSince and shortTimeSince', () => {
    const now = new Date('2026-11-15T14:30:00Z');

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(now);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('says "just now" under a minute, and counts at least one minute for a badge', () => {
      const dates = startFormatter('Asia/Tbilisi', Language.English);

      expect(dates.timeSince('2026-11-15T14:29:30Z')).toBe('just now');
      expect(dates.shortTimeSince('2026-11-15T14:29:30Z')).toBe('1m');
    });

    it('counts minutes, then hours', () => {
      const dates = startFormatter('Asia/Tbilisi', Language.English);

      expect(dates.timeSince('2026-11-15T14:18:00Z')).toBe('12 minutes ago');
      expect(dates.shortTimeSince('2026-11-15T14:18:00Z')).toBe('12m');
      expect(dates.timeSince('2026-11-15T11:20:00Z')).toBe('3 hours ago');
      expect(dates.shortTimeSince('2026-11-15T11:20:00Z')).toBe('3h');
    });

    it('says "yesterday", then the date, and gives a badge no count from a day back', () => {
      const dates = startFormatter('Asia/Tbilisi', Language.English);

      expect(dates.timeSince('2026-11-14T12:00:00Z')).toBe('yesterday');
      expect(dates.timeSince('2026-11-11T12:00:00Z')).toBe('4 days ago');
      expect(dates.timeSince('2026-11-02T12:00:00Z')).toBe('Nov 2');
      expect(dates.shortTimeSince('2026-11-14T12:00:00Z')).toBeNull();
    });

    it('writes Georgian', () => {
      const dates = startFormatter('Asia/Tbilisi', Language.Georgian);

      expect(dates.timeSince('2026-11-15T14:18:00Z')).toBe('12 წუთის წინ');
      expect(dates.shortTimeSince('2026-11-15T14:18:00Z')).toBe('12წთ');
      expect(dates.timeSince('2026-11-15T14:29:30Z')).toBe('ახლახან');
    });

    it('moves on as the minutes pass', () => {
      const dates = startFormatter('Asia/Tbilisi', Language.English);

      vi.advanceTimersByTime(2 * 60_000);

      expect(dates.timeSince('2026-11-15T14:29:30Z')).toBe('2 minutes ago');
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

  describe('birthday', () => {
    // Midnight UTC, which is still the evening before in Los Angeles.
    const dateOfBirth = '2000-03-01T00:00:00Z';

    it.each(['America/Los_Angeles', 'Asia/Tbilisi', 'Pacific/Kiritimati'])(
      'writes the day and the month the user entered, without the year, in %s',
      (timeZone) => {
        const dates = startFormatter(timeZone, Language.English);

        expect(dates.birthday(dateOfBirth)).toBe('March 1');
      },
    );

    it('writes it in Georgian too', () => {
      const dates = startFormatter('America/Los_Angeles', Language.Georgian);

      expect(dates.birthday(dateOfBirth)).toBe('1 მარტი');
    });
  });
});
