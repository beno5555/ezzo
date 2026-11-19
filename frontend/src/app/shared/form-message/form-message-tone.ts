// The two kinds of message a form shows: a failure above its submit button, a notice at its top.
export const FormMessageTone = { Danger: 'danger', Success: 'success' } as const;
export type FormMessageTone = (typeof FormMessageTone)[keyof typeof FormMessageTone];
