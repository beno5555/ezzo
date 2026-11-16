// The three looks of a Button (DESIGN.md, Components): one primary action per screen, quiet for the
// others, danger for a destructive action.
export const ButtonLook = { Primary: 'primary', Quiet: 'quiet', Danger: 'danger' } as const;
export type ButtonLook = (typeof ButtonLook)[keyof typeof ButtonLook];
