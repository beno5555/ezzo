import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router, provideRouter, withRouterConfig } from '@angular/router';
import { filter, firstValueFrom } from 'rxjs';
import { NavigationHistoryStore } from './navigation-history-store';
import { routerConfig } from './router-config';

@Component({ template: '' })
class EmptyPage {}

describe('NavigationHistoryStore', () => {
  const fallback = '/';
  let router: Router;
  let location: Location;
  let history: NavigationHistoryStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            {
              path: 'guarded',
              canActivate: [() => router.parseUrl('/target')],
              component: EmptyPage,
            },
            { path: '**', component: EmptyPage },
          ],
          withRouterConfig(routerConfig),
        ),
      ],
    });
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    history = TestBed.inject(NavigationHistoryStore);
    history.follow();
  });

  // Runs a move and waits for the navigation it causes. The browser's own Back and Forward buttons are
  // such moves: the router answers them with a navigation of its own.
  async function movedThrough(move: () => void): Promise<void> {
    const arrived = firstValueFrom(
      router.events.pipe(filter((event) => event instanceof NavigationEnd)),
    );

    move();
    await arrived;
  }

  // The page the visit starts on, as when the browser opens the app at an address.
  async function openAt(address: string): Promise<void> {
    location.go(address);
    await movedThrough(() => router.initialNavigation());
  }

  it('has nothing to go back to on a page opened directly', async () => {
    await openAt('/posts/5');

    expect(history.canGoBack()).toBe(false);
  });

  it('can go back after the reader followed a link', async () => {
    await openAt('/users/ana');
    await router.navigateByUrl('/posts/5');

    expect(history.canGoBack()).toBe(true);
  });

  it('does not count a navigation that replaced the page', async () => {
    await openAt('/');
    await router.navigateByUrl('/posts/new', { replaceUrl: true });

    expect(history.canGoBack()).toBe(false);
  });

  it('counts a redirect by a guard as one page', async () => {
    await openAt('/');
    await router.navigateByUrl('/guarded');
    await movedThrough(() => location.back());

    expect(router.url).toBe('/');
    expect(history.canGoBack()).toBe(false);
  });

  it('does not count the same address opened again', async () => {
    await openAt('/posts/5');
    await router.navigateByUrl('/posts/5');

    expect(history.canGoBack()).toBe(false);
  });

  it('follows the browser back and forward', async () => {
    await openAt('/');
    await router.navigateByUrl('/users/ana');
    await router.navigateByUrl('/posts/5');

    await movedThrough(() => location.back());
    expect(history.canGoBack()).toBe(true);

    await movedThrough(() => location.back());
    expect(history.canGoBack()).toBe(false);

    await movedThrough(() => location.forward());
    expect(history.canGoBack()).toBe(true);
  });

  it('does not count the entries from before a reload', async () => {
    // The entries a visit left behind, as a reloaded page finds them: the numbers it stamped then are
    // not the router's new ids, which start again at 1.
    location.go('/posts/5', '', { navigationId: 1, historyPosition: 0 });
    location.go('/users/ana', '', { navigationId: 1, historyPosition: 1 });
    await movedThrough(() => router.initialNavigation());
    await router.navigateByUrl('/search');

    await movedThrough(() => location.back());
    expect(history.canGoBack()).toBe(false);

    await movedThrough(() => location.back());
    expect(router.url).toBe('/posts/5');
    expect(history.canGoBack()).toBe(false);
  });

  it('follows a jump over several entries', async () => {
    await openAt('/');
    await router.navigateByUrl('/users/ana');
    await router.navigateByUrl('/posts/5');
    await router.navigateByUrl('/friends');

    await movedThrough(() => location.historyGo(-3));
    expect(history.canGoBack()).toBe(false);

    await movedThrough(() => location.historyGo(2));
    expect(router.url).toBe('/posts/5');
    expect(history.canGoBack()).toBe(true);
  });

  it('keeps counting through a page replaced after going back', async () => {
    await openAt('/');
    await router.navigateByUrl('/settings');
    await router.navigateByUrl('/users/ana');
    await movedThrough(() => location.back());
    await router.navigateByUrl('/users/bob', { replaceUrl: true });

    await movedThrough(() => location.forward());
    expect(router.url).toBe('/users/ana');
    expect(history.canGoBack()).toBe(true);

    await movedThrough(() => location.back());
    expect(router.url).toBe('/users/bob');
    expect(history.canGoBack()).toBe(true);
  });

  it('goes back to the page the reader came from', async () => {
    await openAt('/users/ana');
    await router.navigateByUrl('/posts/5');

    await movedThrough(() => history.goBack(fallback));

    expect(router.url).toBe('/users/ana');
  });

  it('goes to the fallback when the page was opened directly', async () => {
    await openAt('/posts/5');

    await history.goBack('/friends');

    expect(router.url).toBe('/friends');
  });

  it('keeps the browser in charge of a click with a modifier key', () => {
    const event = new MouseEvent('click', { button: 0, ctrlKey: true, cancelable: true });

    history.followBackLink(event, fallback);

    expect(event.defaultPrevented).toBe(false);
  });

  it('takes over a plain click', async () => {
    await openAt('/users/ana');
    await router.navigateByUrl('/posts/5');
    const event = new MouseEvent('click', { button: 0, cancelable: true });

    await movedThrough(() => history.followBackLink(event, fallback));

    expect(event.defaultPrevented).toBe(true);
    expect(router.url).toBe('/users/ana');
  });
});
