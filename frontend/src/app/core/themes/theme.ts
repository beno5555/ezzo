// The two themes, as the values of the root element's data-theme marker that design-tokens.css reads.
export const Theme = { Light: 'light', Dark: 'dark' } as const;
export type Theme = (typeof Theme)[keyof typeof Theme];

// Where the visitor's choice is remembered between visits. It lives in this file, which imports nothing,
// so that the screenshot command (tools/screenshots) sets a theme through the same stored value.
export const themeStorageKey = 'webcity.theme';
