import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, Routes, provideRouter, withRouterConfig } from '@angular/router';
import { routes } from '../../app.routes';
import { SessionStore } from '../session/session-store';
import { routerConfig } from './router-config';

@Component({ template: '' })
class EmptyPage {}

// The real route table with empty pages, so a test reads where a navigation ends without loading a page.
function withEmptyPages(tree: Routes): Routes {
  return tree.map((route) => ({
    ...route,
    ...(route.loadComponent && { loadComponent: undefined, component: EmptyPage }),
    ...(route.children && { children: withEmptyPages(route.children) }),
  }));
}

describe('the home address', () => {
  const isSignedIn = signal(false);
  let router: Router;

  beforeEach(() => {
    isSignedIn.set(false);
    TestBed.configureTestingModule({
      providers: [
        provideRouter(withEmptyPages(routes), withRouterConfig(routerConfig)),
        { provide: SessionStore, useValue: { isSignedIn, isAdministrator: signal(false) } },
      ],
    });
    router = TestBed.inject(Router);
  });

  // The page the router ended at: of the two at "/", the feed is the one with a title.
  function shownPage(): string {
    const route = router.routerState.snapshot.root.firstChild?.routeConfig;
    const pageAtHome = route?.title === 'feed' ? 'feed' : 'landing';

    return route?.path === '' ? pageAtHome : 'another';
  }

  it('shows a guest the landing page', async () => {
    await router.navigateByUrl('/');

    expect(shownPage()).toBe('landing');
  });

  it('shows a signed-in user the feed', async () => {
    isSignedIn.set(true);
    await router.navigateByUrl('/');

    expect(shownPage()).toBe('feed');
  });

  it('swaps the landing page for the feed after signing in, and back after signing out', async () => {
    await router.navigateByUrl('/');

    isSignedIn.set(true);
    await router.navigateByUrl('/');
    expect(shownPage()).toBe('feed');

    isSignedIn.set(false);
    await router.navigateByUrl('/');
    expect(shownPage()).toBe('landing');
  });

  it.each([
    ['/sign-in', '/'],
    ['/feed', '/'],
    ['/sign-in?returnUrl=%2Fposts%2F7', '/?returnUrl=%2Fposts%2F7'],
    ['/feed?from=email', '/?from=email'],
  ])('sends a guest from %s to %s', async (former, expected) => {
    await router.navigateByUrl(former);

    expect(router.url).toBe(expected);
    expect(shownPage()).toBe('landing');
  });

  it.each(['/sign-in', '/feed'])('shows a signed-in user the feed for %s', async (former) => {
    isSignedIn.set(true);
    await router.navigateByUrl(former);

    expect(router.url).toBe('/');
    expect(shownPage()).toBe('feed');
  });

  it('brings a guest turned away from a page to the landing page with the return address', async () => {
    await router.navigateByUrl('/messages/john_doe');

    expect(router.url).toBe('/?returnUrl=%2Fmessages%2Fjohn_doe');
    expect(shownPage()).toBe('landing');
  });
});
