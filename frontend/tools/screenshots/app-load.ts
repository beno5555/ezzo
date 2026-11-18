import type { Language } from '../../src/app/core/languages/language.ts';
import type { Theme } from '../../src/app/core/themes/theme.ts';

// One load of an app address in one theme and language. Its three widths are photographed from the
// same load, because only a theme or a language needs a reload: the stores read them at startup.
export type AppLoad = {
  path: string;
  signedIn: boolean;
  theme: Theme;
  language: Language;
};
