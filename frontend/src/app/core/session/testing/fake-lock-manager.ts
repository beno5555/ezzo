type Turn = { granted: Promise<void>; release: () => void };

// Stands in for navigator.locks, which jsdom lacks: one exclusive lock, granted in request order.
export class FakeLockManager {
  private lastTurn: Promise<void> = Promise.resolve();

  async request<T>(_name: string, callback: () => Promise<T>): Promise<T> {
    const turn = this.takeNextTurn();
    await turn.granted;

    try {
      return await callback();
    } finally {
      turn.release();
    }
  }

  // Takes the lock as another tab would, until the returned function is called.
  holdAsAnotherTab(): () => void {
    return this.takeNextTurn().release;
  }

  private takeNextTurn(): Turn {
    const granted = this.lastTurn;
    let release = (): void => undefined;
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.lastTurn = granted.then(() => released);

    return { granted, release };
  }
}

export function installFakeLockManager(): FakeLockManager {
  const lockManager = new FakeLockManager();
  Object.defineProperty(navigator, 'locks', { value: lockManager, configurable: true });

  return lockManager;
}
