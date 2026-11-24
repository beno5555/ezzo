// The languages the interface ships in, as the BCP 47 tags that Intl and the html lang attribute take.
export const Language = { English: 'en', Georgian: 'ka' } as const;
export type Language = (typeof Language)[keyof typeof Language];

// A switch always names each language in its own language, even before its dictionary loads.
export const languageNames: Record<Language, string> = {
  [Language.English]: 'English',
  [Language.Georgian]: 'ქართული',
};

// Where the visitor's choice is remembered between visits. It lives in this file, which imports nothing,
// so that the screenshot command (tools/screenshots) sets a language through the same stored value.
export const languageStorageKey = 'webcity.language';
