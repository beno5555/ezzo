import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';
import { Theme } from './theme';

// The script in the head of index.html repeats both constants and the rule in startingTheme, so that the
// marker is set before the first paint; theme-boot.spec.ts fails when the two disagree.

// Where the visitor's choice is remembered between visits.
export const themeStorageKey = 'webcity.theme';
// The media query that matches while the operating system asks for a dark theme.
export const darkSchemeQuery = '(prefers-color-scheme: dark)';

// The current theme. Once the app has loaded, the only code that writes the data-theme marker on the
// root element; before that, the head script in index.html has written the same value.
@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly document = inject(DOCUMENT);
  private readonly current = signal<Theme>(startingTheme());

  readonly theme = this.current.asReadonly();

  constructor() {
    effect(() => {
      this.document.documentElement.dataset['theme'] = this.current();
    });
  }

  setTheme(theme: Theme): void {
    this.current.set(theme);
    localStorage.setItem(themeStorageKey, theme);
  }
}

// The remembered choice; with none, the operating system's setting at this load.
function startingTheme(): Theme {
  let result: Theme;
  const stored = localStorage.getItem(themeStorageKey);

  if (isTheme(stored)) {
    result = stored;
  } else {
    const systemPrefersDark = matchMedia(darkSchemeQuery).matches;
    result = systemPrefersDark ? Theme.Dark : Theme.Light;
  }

  return result;
}

function isTheme(value: string | null): value is Theme {
  return Object.values<string | null>(Theme).includes(value);
}
