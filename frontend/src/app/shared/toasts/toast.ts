import { ToastLook } from './toast-look';
import { ToastPerson } from './toast-person';

// One toast: a short message over the page that leaves by itself. link is an address inside the app
// that a click on the toast opens, or null for a toast that only tells. person is who a live toast is
// about, or null; the message then says what they did.
export type Toast = {
  id: number;
  message: string;
  link: string | null;
  look: ToastLook;
  person: ToastPerson | null;
};
