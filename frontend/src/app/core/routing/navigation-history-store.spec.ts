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
    const arrived = firstValueFrom(router.events.pipe(filter((e) => e instanceof NavigationEnd)));

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
