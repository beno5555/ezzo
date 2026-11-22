import { Injectable, signal } from '@angular/core';

export const minuteInMilliseconds = 60_000;

// The time now, as a signal that moves on once a minute, so that a text such as "Active 5 minutes ago"
// redraws as the minutes pass without anything else changing. Read it where a text counts time from now.
@Injectable({ providedIn: 'root' })
export class MinuteClock {
  private readonly current = signal(Date.now());

  readonly now = this.current.asReadonly();

  constructor() {
    setInterval(() => this.current.set(Date.now()), minuteInMilliseconds);
  }
}
