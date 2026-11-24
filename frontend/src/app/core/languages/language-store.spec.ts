import { TestBed } from '@angular/core/testing';
import { dictionaryLoaders } from './dictionaries';
import { english } from './english';
import { georgian } from './georgian';
import { initialLanguage, loadInitialLanguage } from './initial-language';
import { Language, languageStorageKey } from './language';
import { LanguageStore } from './language-store';

describe('LanguageStore', () => {
  async function startStore(browserLanguage: string): Promise<LanguageStore> {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue(browserLanguage);
    const startup = await loadInitialLanguage();
    TestBed.overrideProvider(initialLanguage, { useValue: startup });
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
      async (browserLanguage) => {
        const loadEnglish = vi.spyOn(dictionaryLoaders, Language.English);
        const store = await startStore(browserLanguage);

        expect(store.language()).toBe(Language.Georgian);
        expect(store.text()).toBe(georgian);
        expect(loadEnglish).not.toHaveBeenCalled();
      },
    );

    // kab is Kabyle: it shares Georgian's first letters but is another language.
    it.each(['en-US', 'ru', 'de-DE', 'kab'])(
      'starts in English when the browser prefers %s',
      async (browserLanguage) => {
        const loadGeorgian = vi.spyOn(dictionaryLoaders, Language.Georgian);
        const store = await startStore(browserLanguage);

        expect(store.language()).toBe(Language.English);
        expect(store.text()).toBe(english);
        expect(loadGeorgian).not.toHaveBeenCalled();
      },
    );
  });

  describe('setLanguage', () => {
    it('switches the current dictionary in place when it is ready', async () => {
      const store = await startStore('en-US');

      const switched = store.setLanguage(Language.Georgian);

      expect(store.text()).toBe(english);
      await switched;

      expect(store.language()).toBe(Language.Georgian);
      expect(store.text()).toBe(georgian);
    });

    it('is remembered over the browser language on the next visit', async () => {
      const store = await startStore('en-US');
      await store.setLanguage(Language.Georgian);
      TestBed.resetTestingModule();

      const nextVisit = await startStore('en-US');

      expect(nextVisit.language()).toBe(Language.Georgian);
    });

    it('marks the page with the current language', async () => {
      const store = await startStore('en-US');

      await store.setLanguage(Language.Georgian);
      TestBed.tick();

      expect(document.documentElement.lang).toBe(Language.Georgian);
    });

    it('keeps the latest choice when an earlier dictionary finishes loading', async () => {
      const store = await startStore('en-US');

      const georgianSwitch = store.setLanguage(Language.Georgian);
      await store.setLanguage(Language.English);
      await georgianSwitch;

      expect(store.language()).toBe(Language.English);
      expect(localStorage.getItem(languageStorageKey)).toBe(Language.English);
    });

    it('keeps the current language on a load failure and clears the error after a successful switch', async () => {
      const store = await startStore('en-US');
      vi.spyOn(dictionaryLoaders, Language.Georgian).mockRejectedValueOnce(new Error('Offline'));

      await store.setLanguage(Language.Georgian);

      expect(store.text()).toBe(english);
      expect(store.switchFailed()).toBe(true);
      expect(localStorage.getItem(languageStorageKey)).toBeNull();

      await store.setLanguage(Language.Georgian);

      expect(store.text()).toBe(georgian);
      expect(store.switchFailed()).toBe(false);
    });
  });

  it('ignores a stored value that is not a language', async () => {
    localStorage.setItem(languageStorageKey, 'xx');

    const store = await startStore('ka');

    expect(store.language()).toBe(Language.Georgian);
  });
});
