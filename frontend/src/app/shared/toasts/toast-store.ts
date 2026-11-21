import { Injectable, signal } from '@angular/core';
import { Toast } from './toast';

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

  readonly visible = this.shown.asReadonly();

  // link is an address inside the app that a click on the toast opens. A toast equal to one already
  // shown or waiting (same message, same link) is skipped, so an action clicked again and again while
  // it fails shows its failure once, not once per click.
  show(message: string, link: string | null = null): void {
    const isEqual = (toast: Toast) => toast.message === message && toast.link === link;
    const isRepeat = this.shown().some(isEqual) || this.waiting.some(isEqual);

    if (!isRepeat) {
      this.add(message, link);
    }
  }

  // Never skipped as a repeat: two uploads under way show two toasts, each replaced by its own outcome.
  // Returns the id that replace() and dismiss() take.
  showLasting(message: string): number {
    const id = this.add(message, null, true);

    return id;
  }

  // Puts an ordinary toast in a lasting toast's place, shown or waiting; it leaves 5 seconds after it
  // shows. When the lasting toast has already gone, the new one is shown as any other toast.
  replace(id: number, message: string, link: string | null = null): void {
    const isLasting = this.lastingIds.has(id);

    if (isLasting) {
      const replacement: Toast = { id, message, link };
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
    } else {
      this.show(message, link);
    }
  }

  // On a timer, early when the user follows the toast's link, or in code for a lasting toast, which may
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

  private add(message: string, link: string | null, isLasting = false): number {
    this.lastId += 1;
    if (isLasting) {
      this.lastingIds.add(this.lastId);
    }
    this.waiting.push({ id: this.lastId, message, link });
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
