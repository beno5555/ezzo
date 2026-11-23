import { Location } from '@angular/common';
import { Component, Signal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withRouterConfig } from '@angular/router';
import { landingPageMark } from '../routing/landing-page-mark';
import { routerConfig } from '../routing/router-config';
import { signedInMatch } from '../routing/signed-in-match';
import { SessionStore } from '../session/session-store';
import { isOnLandingPage } from './is-on-landing-page';

@Component({ template: '' })
class EmptyPage {}

describe('isOnLandingPage', () => {
  const isSignedIn = signal(false);

  // The answer for an app opened at the address, before its first navigation.
  function openAt(address: string, signedIn: boolean): Signal<boolean> {
    isSignedIn.set(signedIn);
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            { path: '', pathMatch: 'full', canMatch: [signedInMatch], component: EmptyPage },
            {
              path: '',
              pathMatch: 'full',
              data: { [landingPageMark]: true },
              component: EmptyPage,
            },
            { path: 'search', component: EmptyPage },
          ],
          withRouterConfig(routerConfig),
        ),
        { provide: SessionStore, useValue: { isSignedIn } },
      ],
    });
    TestBed.inject(Location).go(address);

    return TestBed.runInInjectionContext(() => isOnLandingPage());
  }

  it.each([
    { address: '/', signedIn: false, expected: true },
    { address: '/?returnUrl=%2Ffriends', signedIn: false, expected: true },
    { address: '/sign-in', signedIn: false, expected: true },
    { address: '/feed', signedIn: false, expected: true },
    { address: '/', signedIn: true, expected: false },
    { address: '/search', signedIn: false, expected: false },
  ])(
    'starts as $expected at $address with signed in $signedIn',
    ({ address, signedIn, expected }) => {
      expect(openAt(address, signedIn)()).toBe(expected);
    },
  );

  it('changes with the page, not with the session', async () => {
    const onLandingPage = openAt('/', false);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/');

    isSignedIn.set(true);
    expect(onLandingPage()).toBe(true);

    await router.navigateByUrl('/');
    expect(onLandingPage()).toBe(false);
  });
});
