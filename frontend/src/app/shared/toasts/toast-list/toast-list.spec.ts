import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ToastLook } from '../toast-look';
import { ToastStore } from '../toast-store';
import { ToastList } from './toast-list';

describe('ToastList', () => {
  let toastStore: ToastStore;

  function render(): HTMLElement {
    const fixture = TestBed.createComponent(ToastList);
    fixture.detectChanges();

    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    toastStore = TestBed.inject(ToastStore);
  });

  it('shows a person with their name apart from what they did, so the name stands out', () => {
    toastStore.show('commented on your post', {
      link: '/posts/12',
      look: ToastLook.Comment,
      person: { id: 4, username: 'bob' },
    });

    const toast = render().querySelector('a');

    expect(toast?.querySelector('.text-ink-strong')?.textContent).toBe('bob');
    expect(toast?.textContent).toContain('commented on your post');
    expect(toast?.querySelector('app-avatar')).not.toBeNull();
  });

  it('marks a friend who came online with a green dot, and no other toast has one', () => {
    toastStore.show('is online', {
      look: ToastLook.Online,
      person: { id: 3, username: 'alice' },
    });
    toastStore.show('liked your post', {
      look: ToastLook.Like,
      person: { id: 4, username: 'bob' },
    });

    const [online, liked] = Array.from(render().querySelectorAll('section > div'));

    expect(online.querySelector('.bg-success')).not.toBeNull();
    expect(liked.querySelector('.bg-success')).toBeNull();
    expect(liked.querySelector('.bg-danger')).not.toBeNull();
  });

  it('shows a toast about no one as an icon and its text, with no picture', () => {
    toastStore.show('Could not like the post.');

    const toast = render().querySelector('section > div');

    expect(toast?.querySelector('app-avatar')).toBeNull();
    expect(toast?.querySelector('.text-danger')).not.toBeNull();
    expect(toast?.textContent).toContain('Could not like the post.');
  });

  it('reads as a link only when it has an address', () => {
    toastStore.show('Plain');
    toastStore.show('With a link', { link: '/posts/12' });

    const toasts = Array.from(render().querySelectorAll('section > div'));

    expect(toasts[0].querySelector('a')).toBeNull();
    expect(toasts[1].querySelector('a')?.getAttribute('href')).toBe('/posts/12');
  });
});
