// What a toast looks like at a glance, so that the reader knows what it tells before reading it
// (DESIGN.md, Components). Failure is the default look: most toasts say that an action did not work.
// Message, Comment, Like and Online are the live toasts about a person (ticket 21) and show that
// person's picture with a badge for the event; Uploading is for a lasting toast.
export const ToastLook = {
  Failure: 'failure',
  Success: 'success',
  Uploading: 'uploading',
  Message: 'message',
  Comment: 'comment',
  Like: 'like',
  Online: 'online',
} as const;
export type ToastLook = (typeof ToastLook)[keyof typeof ToastLook];
