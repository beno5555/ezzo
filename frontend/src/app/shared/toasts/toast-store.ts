import { Injectable, signal } from '@angular/core';
import { Toast } from './toast';
import { ToastLook } from './toast-look';
import { ToastOptions } from './toast-options';

// The toast rules (spec, Toasts): each toast stays 5 seconds, and at most three show at once.
export const toastRules = {
  shownMilliseconds: 5000,
  maxShown: 3,
} as const;

// The toasts on screen, and those that wait for a place. A toast's 5 seconds start when it is shown,
// so one that waited still gets its full time. Failures of actions outside a form and live
// notifications (ticket 21) both come through show(). A lasting toast (an upload under way, tickets 10
// and 12) has no timer: it stays until replace() or dismiss() is called for it.
@Injectable({ providedIn: 'root' })
export class ToastStore {
  private readonly shown = signal<readonly Toast[]>([]);
  // Nothing shows the waiting toasts, so they need no signal.
  private readonly waiting: Toast[] = [];
  // The ids of the lasting toasts, shown or waiting.
  private readonly lastingIds = new Set<number>();
  private lastId = 0;
  // Every toast with an id up to this one was taken down by clear().
  private lastClearedId = 0;

  readonly visible = this.shown.asReadonly();

  // options.link is an address inside the app that a click on the toast opens; options.look says what
  // kind of toast it is (a failure unless told otherwise); options.person is who a live toast is about.
  // A toast equal to one already shown or waiting (same message, same link, same person) is skipped, so an
  // action clicked again and again while it fails shows its failure once, not once per click. Two people
  // who like the same post are two toasts: the message and the link are the same, the person is not.
  show(message: string, options: ToastOptions = {}): void {
    const link = options.link ?? null;
    const personId = options.person?.id ?? null;
    const isEqual = (toast: Toast) =>
      toast.message === message && toast.link === link && (toast.person?.id ?? null) === personId;
    const isRepeat = this.shown().some(isEqual) || this.waiting.some(isEqual);

    if (!isRepeat) {
      this.add(message, options);
    }
  }

  // Never skipped as a repeat: two uploads under way show two toasts, each replaced by its own outcome.
  // Returns the id that replace() and dismiss() take.
  showLasting(message: string): number {
    const id = this.add(message, { look: ToastLook.Uploading }, true);

    return id;
  }

  // Puts an ordinary toast in a lasting toast's place, shown or waiting; it leaves 5 seconds after it
  // shows. When the lasting toast has already gone, the new one is shown as any other toast, except when
  // clear() took it down: the outcome of a session's upload does not show over the next screen.
  replace(id: number, message: string, options: ToastOptions = {}): void {
    const isLasting = this.lastingIds.has(id);
    const wasCleared = id <= this.lastClearedId;

    if (isLasting) {
      const replacement = toToast(id, message, options);
      const isShown = this.shown().some((toast) => toast.id === id);

      this.lastingIds.delete(id);
      if (isShown) {
        this.shown.update((shown) => shown.map((toast) => (toast.id === id ? replacement : toast)));
        this.leaveLater(id);
      } else {
        this.waiting.splice(
          this.waiting.findIndex((toast) => toast.id === id),
          1,
          replacement,
        );
      }
    } else if (!wasCleared) {
      this.show(message, options);
    }
  }

  // Removes every toast, shown or waiting, lasting or not: on sign-out, so that a toast about one session
  // (a message's text) does not stay over the next screen. A timer already set then finds nothing to remove.
  clear(): void {
    this.lastClearedId = this.lastId;
    this.waiting.length = 0;
    this.lastingIds.clear();
    this.shown.set([]);
  }

  // On a timer, early when the user follows the toast's link or closes it, or in code for a lasting toast, which may
  // still be waiting for a place.
  dismiss(id: number): void {
    const waitingIndex = this.waiting.findIndex((toast) => toast.id === id);
    const isWaiting = waitingIndex >= 0;

    if (isWaiting) {
      this.waiting.splice(waitingIndex, 1);
    }
    this.lastingIds.delete(id);
    this.shown.update((shown) => shown.filter((toast) => toast.id !== id));
    this.showWaiting();
  }

  private add(message: string, options: ToastOptions, isLasting = false): number {
    this.lastId += 1;
    if (isLasting) {
      this.lastingIds.add(this.lastId);
    }
    this.waiting.push(toToast(this.lastId, message, options));
    this.showWaiting();

    return this.lastId;
  }

  private showWaiting(): void {
    const freePlaces = Math.max(toastRules.maxShown - this.shown().length, 0);
    const arriving = this.waiting.splice(0, freePlaces);

    this.shown.update((shown) => [...shown, ...arriving]);
    for (const toast of arriving) {
      const isLasting = this.lastingIds.has(toast.id);

      if (!isLasting) {
        this.leaveLater(toast.id);
      }
    }
  }

  private leaveLater(id: number): void {
    setTimeout(() => this.dismiss(id), toastRules.shownMilliseconds);
  }
}

function toToast(id: number, message: string, options: ToastOptions): Toast {
  return {
    id,
    message,
    link: options.link ?? null,
    look: options.look ?? ToastLook.Failure,
    person: options.person ?? null,
  };
}
