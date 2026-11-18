import { TestBed } from '@angular/core/testing';
import { english } from './english';
import { georgian } from './georgian';
import { Language, languageStorageKey } from './language';
import { LanguageStore } from './language-store';

describe('LanguageStore', () => {
  function startStore(browserLanguage: string): LanguageStore {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue(browserLanguage);
    return TestBed.inject(LanguageStore);
  }

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('first visit', () => {
    it.each(['ka', 'ka-GE'])(
      'starts in Georgian when the browser prefers %s',
      (browserLanguage) => {
        const store = startStore(browserLanguage);

        expect(store.language()).toBe(Language.Georgian);
        expect(store.text()).toBe(georgian);
      },
    );

    // kab is Kabyle: it shares Georgian's first letters but is another language.
    it.each(['en-US', 'ru', 'de-DE', 'kab'])(
      'starts in English when the browser prefers %s',
      (browserLanguage) => {
        const store = startStore(browserLanguage);

        expect(store.language()).toBe(Language.English);
        expect(store.text()).toBe(english);
      },
    );
  });

  describe('setLanguage', () => {
    it('switches the current dictionary in place', () => {
      const store = startStore('en-US');

      store.setLanguage(Language.Georgian);

      expect(store.language()).toBe(Language.Georgian);
      expect(store.text()).toBe(georgian);
    });

    it('is remembered over the browser language on the next visit', () => {
      startStore('en-US').setLanguage(Language.Georgian);
      TestBed.resetTestingModule();

      const nextVisit = startStore('en-US');

      expect(nextVisit.language()).toBe(Language.Georgian);
    });

    it('marks the page with the current language', () => {
      const store = startStore('en-US');

      store.setLanguage(Language.Georgian);
      TestBed.tick();

      expect(document.documentElement.lang).toBe(Language.Georgian);
    });
  });

  it('ignores a stored value that is not a language', () => {
    localStorage.setItem(languageStorageKey, 'xx');

    const store = startStore('ka');

    expect(store.language()).toBe(Language.Georgian);
  });
});
