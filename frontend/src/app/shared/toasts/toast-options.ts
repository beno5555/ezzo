import { ToastLook } from './toast-look';
import { ToastPerson } from './toast-person';

// What a caller may add to a toast's message: all optional.
export type ToastOptions = {
  link?: string | null;
  look?: ToastLook;
  person?: ToastPerson | null;
};
