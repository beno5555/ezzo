// One toast: a short message over the page that leaves by itself. link is an address inside the app
// that a click on the toast opens, or null for a toast that only tells.
export type Toast = {
  id: number;
  message: string;
  link: string | null;
};
