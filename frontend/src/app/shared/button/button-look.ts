// The looks of a Button (DESIGN.md, Components): one primary action per screen, quiet for the
// others, danger for a destructive action, and danger-text for one repeated on every row of a list.
export const ButtonLook = {
  Primary: 'primary',
  Quiet: 'quiet',
  Danger: 'danger',
  DangerText: 'danger-text',
} as const;
export type ButtonLook = (typeof ButtonLook)[keyof typeof ButtonLook];
