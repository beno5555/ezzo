// The two themes, as the values of the root element's data-theme marker that design-tokens.css reads.
export const Theme = { Light: 'light', Dark: 'dark' } as const;
export type Theme = (typeof Theme)[keyof typeof Theme];
