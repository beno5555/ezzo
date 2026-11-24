import { InjectionToken } from '@angular/core';
import { dictionaryLoaders } from './dictionaries';
import { Language, languageStorageKey } from './language';
import { LanguageSelection } from './language-selection';

export const initialLanguage = new InjectionToken<LanguageSelection | Promise<LanguageSelection>>(
  'Startup language and dictionary',
);

export async function loadInitialLanguage(): Promise<LanguageSelection> {
  const language = startingLanguage();
  const text = await dictionaryLoaders[language]();

  return { language, text };
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
