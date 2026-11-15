import { Language } from './language';
import { PluralForms } from './plural-forms';

// Picks the form a language uses for a count. A category the entry does not list falls back to `other`.
export function pluralize(language: Language, count: number, forms: PluralForms): string {
  const category = new Intl.PluralRules(language).select(count);

  return forms[category] ?? forms.other;
}
