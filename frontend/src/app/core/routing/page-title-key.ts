import { Dictionary } from '../languages/dictionary';

// A route's title: the key of the page's name in the dictionary's pages group, never the text itself,
// so the title follows the language.
export type PageTitleKey = keyof Dictionary['pages'];

export function isPageTitleKey(
  pages: Dictionary['pages'],
  value: string | undefined,
): value is PageTitleKey {
  return value !== undefined && Object.hasOwn(pages, value);
}
