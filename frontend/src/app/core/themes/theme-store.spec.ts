import { TestBed } from '@angular/core/testing';
import { Theme, themeStorageKey } from './theme';
import { ThemeStore, darkSchemeQuery } from './theme-store';

describe('ThemeStore', () => {
  function startStore(systemPrefersDark: boolean): ThemeStore {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === darkSchemeQuery && systemPrefersDark,
    }));
    return TestBed.inject(ThemeStore);
  }

  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset['theme'];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('with no stored choice', () => {
    it('starts dark when the operating system is dark', () => {
      const store = startStore(true);

      expect(store.theme()).toBe(Theme.Dark);
    });

    it('starts light when the operating system is light', () => {
      const store = startStore(false);

      expect(store.theme()).toBe(Theme.Light);
    });
  });

  it('starts in the stored choice over the operating system', () => {
    localStorage.setItem(themeStorageKey, Theme.Light);

    const store = startStore(true);

    expect(store.theme()).toBe(Theme.Light);
  });

  it('ignores a stored value that is not a theme', () => {
    localStorage.setItem(themeStorageKey, 'sepia');

    const store = startStore(true);

    expect(store.theme()).toBe(Theme.Dark);
  });

  describe('setTheme', () => {
    it('changes the current theme in place', () => {
      const store = startStore(false);

      store.setTheme(Theme.Dark);

      expect(store.theme()).toBe(Theme.Dark);
    });

    it('marks the root element with the current theme', () => {
      const store = startStore(false);

      store.setTheme(Theme.Dark);
      TestBed.tick();

      expect(document.documentElement.dataset['theme']).toBe(Theme.Dark);
    });

    it('is remembered over the operating system on the next visit', () => {
      startStore(false).setTheme(Theme.Dark);
      TestBed.resetTestingModule();

      const nextVisit = startStore(false);

      expect(nextVisit.theme()).toBe(Theme.Dark);
    });
  });
});
