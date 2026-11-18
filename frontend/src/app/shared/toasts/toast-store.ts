import { Injectable, signal } from '@angular/core';
import { Toast } from './toast';

// The toast rules (spec, Toasts): each toast stays 5 seconds, and at most three show at once.
export const toastRules = {
  shownMilliseconds: 5000,
  maxShown: 3,
} as const;

// The toasts on screen, and those that wait for a place. A toast's 5 seconds start when it is shown,
// so one that waited still gets its full time. Failures of actions outside a form and live
// notifications (ticket 21) both come through show().
@Injectable({ providedIn: 'root' })
export class ToastStore {
  private readonly shown = signal<readonly Toast[]>([]);
  // Nothing shows the waiting toasts, so they need no signal.
  private readonly waiting: Toast[] = [];
  private lastId = 0;

  readonly visible = this.shown.asReadonly();

  // link is an address inside the app that a click on the toast opens. A toast equal to one already
  // shown or waiting (same message, same link) is skipped, so an action clicked again and again while
  // it fails shows its failure once, not once per click.
  show(message: string, link: string | null = null): void {
    const isEqual = (toast: Toast) => toast.message === message && toast.link === link;
    const isRepeat = this.shown().some(isEqual) || this.waiting.some(isEqual);

    if (!isRepeat) {
      this.lastId += 1;
      this.waiting.push({ id: this.lastId, message, link });
      this.showWaiting();
    }
  }

  // On a timer, or early when the user follows the toast's link.
  dismiss(id: number): void {
    this.shown.update((shown) => shown.filter((toast) => toast.id !== id));
    this.showWaiting();
  }

  private showWaiting(): void {
    const freePlaces = Math.max(toastRules.maxShown - this.shown().length, 0);
    const arriving = this.waiting.splice(0, freePlaces);

    this.shown.update((shown) => [...shown, ...arriving]);
    for (const toast of arriving) {
      setTimeout(() => this.dismiss(toast.id), toastRules.shownMilliseconds);
    }
  }
}
