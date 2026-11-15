import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';
import { Dictionary } from './dictionary';
import { dictionaries } from './dictionaries';
import { Language } from './language';

// Where the visitor's choice is remembered between visits.
export const languageStorageKey = 'webcity.language';

// The current language and its dictionary. Templates read text(), so a switch redraws in place.
@Injectable({ providedIn: 'root' })
export class LanguageStore {
  private readonly document = inject(DOCUMENT);
  private readonly current = signal<Language>(startingLanguage());

  readonly language = this.current.asReadonly();
  readonly text = computed<Dictionary>(() => dictionaries[this.current()]);

  constructor() {
    effect(() => {
      this.document.documentElement.lang = this.current();
    });
  }

  setLanguage(language: Language): void {
    this.current.set(language);
    localStorage.setItem(languageStorageKey, language);
  }
}

// The remembered choice; on a first visit, Georgian for a browser that prefers Georgian, else English.
function startingLanguage(): Language {
  let result: Language;
  const stored = localStorage.getItem(languageStorageKey);

  if (isLanguage(stored)) {
    result = stored;
  } else {
    // The primary subtag: ka-GE is Georgian, kab (Kabyle) is not.
    const browserPrimaryLanguage = navigator.language.toLowerCase().split('-')[0];
    const browserPrefersGeorgian = browserPrimaryLanguage === Language.Georgian;
    result = browserPrefersGeorgian ? Language.Georgian : Language.English;
  }

  return result;
}

function isLanguage(value: string | null): value is Language {
  return Object.values<string | null>(Language).includes(value);
}
