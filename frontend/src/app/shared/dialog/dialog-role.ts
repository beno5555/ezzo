// How a dialog is announced: dialog for one that holds content, alertdialog for one that asks a question
// the user must answer, such as a confirmation.
export const DialogRole = { Dialog: 'dialog', AlertDialog: 'alertdialog' } as const;
export type DialogRole = (typeof DialogRole)[keyof typeof DialogRole];
