// The languages the interface ships in, as the BCP 47 tags that Intl and the html lang attribute take.
export const Language = { English: 'en', Georgian: 'ka' } as const;
export type Language = (typeof Language)[keyof typeof Language];
