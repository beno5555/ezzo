import { TestBed } from '@angular/core/testing';
import indexHtml from '../../../index.html' with { loader: 'text' };
import { Theme } from './theme';
import { ThemeStore, darkSchemeQuery, themeStorageKey } from './theme-store';

// The script in the head of index.html marks the theme before the app loads. It must reach the same
// theme as ThemeStore for every stored value and operating system setting, or a reload flashes.
describe('the theme script in index.html', () => {
  const headScript =
    /<head>[\s\S]*?<script>([\s\S]*?)<\/script>[\s\S]*?<\/head>/.exec(indexHtml)?.[1] ?? '';

  it('finds the script in the head', () => {
    expect(headScript).toContain(themeStorageKey);
  });

  function stubSystem(systemPrefersDark: boolean): void {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === darkSchemeQuery && systemPrefersDark,
    }));
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    delete document.documentElement.dataset['theme'];
  });

  it.each([
    { stored: null, systemPrefersDark: true },
    { stored: null, systemPrefersDark: false },
    { stored: Theme.Light, systemPrefersDark: true },
    { stored: Theme.Dark, systemPrefersDark: false },
    { stored: 'sepia', systemPrefersDark: true },
    { stored: 'sepia', systemPrefersDark: false },
  ])(
    'agrees with ThemeStore when stored is $stored and the system is dark: $systemPrefersDark',
    ({ stored, systemPrefersDark }) => {
      if (stored !== null) {
        localStorage.setItem(themeStorageKey, stored);
      }
      stubSystem(systemPrefersDark);

      new Function(headScript)(); // runs the page's own inline script
      const markedBeforeLoad = document.documentElement.dataset['theme'];

      expect(markedBeforeLoad).toBe(TestBed.inject(ThemeStore).theme());
    },
  );
});
