import { Signal, effect, signal } from '@angular/core';

// A signal that is true until a moment passes and then turns false by itself, at that moment and not at the
// next minute (MinuteClock moves only once a minute). deadline gives the moment in milliseconds since 1970
// and may read signals: when it changes, the signal follows the new moment. It sets up an effect, so call it
// where a component or a service is made:
//   private readonly canEdit = beforeDeadline(() => Date.parse(this.message().sentAt) + window);
// A moment that has passed gives false at once, and sets no timer. deadline is not read where this is called
// (a component's required input has no value in its constructor): the signal starts false and the effect,
// which runs before the first render, sets it.
export function beforeDeadline(deadline: () => number): Signal<boolean> {
  const isBefore = signal(false);

  effect((onCleanup) => {
    const remaining = deadline() - Date.now();
    const isOpen = remaining > 0;

    isBefore.set(isOpen);
    if (isOpen) {
      const timer = setTimeout(() => isBefore.set(false), remaining);
      onCleanup(() => clearTimeout(timer));
    }
  });

  return isBefore.asReadonly();
}
