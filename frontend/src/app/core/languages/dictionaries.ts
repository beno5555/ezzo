import { Dictionary } from './dictionary';
import { english } from './english';
import { georgian } from './georgian';
import { Language } from './language';

// Every language's dictionary. A language added to Language without a dictionary here fails the build.
export const dictionaries: Record<Language, Dictionary> = {
  [Language.English]: english,
  [Language.Georgian]: georgian,
};
