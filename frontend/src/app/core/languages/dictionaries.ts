import { Dictionary } from './dictionary';
import { Language } from './language';

// Build a separate chunk per language. The record keeps the loader list exhaustive.
export const dictionaryLoaders: Record<Language, () => Promise<Dictionary>> = {
  [Language.English]: async () => (await import('./english')).english,
  [Language.Georgian]: async () => (await import('./georgian')).georgian,
};
