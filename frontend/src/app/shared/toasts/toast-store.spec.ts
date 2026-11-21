import { TestBed } from '@angular/core/testing';
import { ToastStore } from './toast-store';

describe('ToastStore', () => {
  let toastStore: ToastStore;

  beforeEach(() => {
    vi.useFakeTimers();
    toastStore = TestBed.inject(ToastStore);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const shownMessages = () => toastStore.visible().map((toast) => toast.message);

  it('shows a toast for 5 seconds, then removes it', () => {
    toastStore.show('Could not like the post.');

    vi.advanceTimersByTime(4999);
    expect(shownMessages()).toEqual(['Could not like the post.']);

    vi.advanceTimersByTime(1);
    expect(shownMessages()).toEqual([]);
  });

  it('shows at most three toasts, and a fourth waits until one of them has left', () => {
    toastStore.show('first');
    vi.advanceTimersByTime(1000);
    toastStore.show('second');
    toastStore.show('third');
    toastStore.show('fourth');

    expect(shownMessages()).toEqual(['first', 'second', 'third']);

    vi.advanceTimersByTime(4000); // the first has been shown for 5 seconds
    expect(shownMessages()).toEqual(['second', 'third', 'fourth']);
  });

  it('gives a waiting toast its full 5 seconds from the moment it is shown', () => {
    toastStore.show('first');
    toastStore.show('second');
    toastStore.show('third');
    vi.advanceTimersByTime(3000);
    toastStore.show('fourth');

    vi.advanceTimersByTime(2000); // the first three leave; the fourth shows now
    expect(shownMessages()).toEqual(['fourth']);

    vi.advanceTimersByTime(4999);
    expect(shownMessages()).toEqual(['fourth']);

    vi.advanceTimersByTime(1);
    expect(shownMessages()).toEqual([]);
  });

  it('carries a link that a click on the toast opens, and none when it is given none', () => {
    toastStore.show('alice sent you a message', '/chat/alice');
    toastStore.show('Could not like the post.');

    expect(toastStore.visible()).toEqual([
      { id: expect.any(Number), message: 'alice sent you a message', link: '/chat/alice' },
      { id: expect.any(Number), message: 'Could not like the post.', link: null },
    ]);
  });

  it('shows the next waiting toast when one is dismissed early', () => {
    toastStore.show('first');
    toastStore.show('second');
    toastStore.show('third');
    toastStore.show('fourth');

    toastStore.dismiss(toastStore.visible()[1].id);

    expect(shownMessages()).toEqual(['first', 'third', 'fourth']);
  });

  it('skips a toast equal to one already shown or waiting, so a repeated failure shows once', () => {
    toastStore.show('Could not like the post.');
    toastStore.show('Could not like the post.');
    toastStore.show('second');
    toastStore.show('third');
    toastStore.show('fourth');
    toastStore.show('fourth');

    expect(shownMessages()).toEqual(['Could not like the post.', 'second', 'third']);
    vi.advanceTimersByTime(5000);
    expect(shownMessages()).toEqual(['fourth']);
  });

  it('shows a toast again once its equal has left, and a toast with another link as its own', () => {
    toastStore.show('alice sent you a message', '/chat/alice');
    toastStore.show('alice sent you a message', '/chat/alice-2');
    vi.advanceTimersByTime(5000);
    toastStore.show('alice sent you a message', '/chat/alice');

    expect(toastStore.visible()).toEqual([
      { id: expect.any(Number), message: 'alice sent you a message', link: '/chat/alice' },
    ]);
  });

  it('shows ten toasts given at once three at a time, in order, until all have left', () => {
    for (let number = 1; number <= 10; number += 1) {
      toastStore.show(`toast ${number}`);
    }

    expect(shownMessages()).toEqual(['toast 1', 'toast 2', 'toast 3']);
    vi.advanceTimersByTime(5000);
    expect(shownMessages()).toEqual(['toast 4', 'toast 5', 'toast 6']);
    vi.advanceTimersByTime(5000);
    expect(shownMessages()).toEqual(['toast 7', 'toast 8', 'toast 9']);
    vi.advanceTimersByTime(5000);
    expect(shownMessages()).toEqual(['toast 10']);
    vi.advanceTimersByTime(5000);
    expect(shownMessages()).toEqual([]);
  });

  it('keeps the next toast its full time when a followed link toast later reaches its own end', () => {
    toastStore.show('alice sent you a message', '/chat/alice');
    toastStore.show('second');
    toastStore.show('third');
    toastStore.show('fourth');
    vi.advanceTimersByTime(1000);

    toastStore.dismiss(toastStore.visible()[0].id); // the user follows the link
    vi.advanceTimersByTime(4000); // the followed toast's own timer ends; the second and third leave

    expect(shownMessages()).toEqual(['fourth']);
    vi.advanceTimersByTime(999); // the fourth was shown at 1 s, so it stays until 6 s
    expect(shownMessages()).toEqual(['fourth']);
    vi.advanceTimersByTime(1);
    expect(shownMessages()).toEqual([]);
  });

  describe('a lasting toast', () => {
    it('stays past 5 seconds until it is dismissed in code', () => {
      const id = toastStore.showLasting('Uploading your post…');

      vi.advanceTimersByTime(60_000);
      expect(shownMessages()).toEqual(['Uploading your post…']);

      toastStore.dismiss(id);
      expect(shownMessages()).toEqual([]);
    });

    it('is replaced in its place by an ordinary toast, which leaves 5 seconds later', () => {
      toastStore.show('first');
      const id = toastStore.showLasting('Uploading your post…');
      toastStore.show('third');
      vi.advanceTimersByTime(30_000);

      toastStore.replace(id, 'Your post is published.', '/posts/12');

      expect(toastStore.visible()).toEqual([
        { id, message: 'Your post is published.', link: '/posts/12' },
      ]);
      vi.advanceTimersByTime(4999);
      expect(shownMessages()).toEqual(['Your post is published.']);
      vi.advanceTimersByTime(1);
      expect(shownMessages()).toEqual([]);
    });

    it('shows once for each upload, even when two have the same text', () => {
      const firstId = toastStore.showLasting('Uploading your post…');
      const secondId = toastStore.showLasting('Uploading your post…');

      expect(firstId).not.toBe(secondId);
      expect(shownMessages()).toEqual(['Uploading your post…', 'Uploading your post…']);
    });

    it('stays while it waits and once shown, until it is replaced', () => {
      toastStore.show('first');
      toastStore.show('second');
      toastStore.show('third');
      const id = toastStore.showLasting('Uploading your post…');

      vi.advanceTimersByTime(60_000);
      expect(shownMessages()).toEqual(['Uploading your post…']);

      toastStore.replace(id, 'Your post is published.', '/posts/12');
      vi.advanceTimersByTime(5000);
      expect(shownMessages()).toEqual([]);
    });

    it('can be replaced while it waits for a place, and then gets its full 5 seconds once shown', () => {
      toastStore.show('first');
      toastStore.show('second');
      toastStore.show('third');
      const id = toastStore.showLasting('Uploading your post…');
      vi.advanceTimersByTime(1000);

      toastStore.replace(id, 'Your post is published.', '/posts/12');
      vi.advanceTimersByTime(4000); // the first three leave; the replaced toast shows now

      expect(shownMessages()).toEqual(['Your post is published.']);
      vi.advanceTimersByTime(4999);
      expect(shownMessages()).toEqual(['Your post is published.']);
      vi.advanceTimersByTime(1);
      expect(shownMessages()).toEqual([]);
    });

    it('never shows when it is dismissed while it waits for a place', () => {
      toastStore.show('first');
      toastStore.show('second');
      toastStore.show('third');
      const id = toastStore.showLasting('Uploading your post…');

      toastStore.dismiss(id);
      vi.advanceTimersByTime(5000);

      expect(shownMessages()).toEqual([]);
    });

    it('becomes a new toast when the one it replaces has already gone', () => {
      const id = toastStore.showLasting('Uploading your post…');
      toastStore.dismiss(id);

      toastStore.replace(id, 'Could not publish your post.');

      expect(toastStore.visible()).toEqual([
        { id: expect.any(Number), message: 'Could not publish your post.', link: null },
      ]);
    });
  });
});
