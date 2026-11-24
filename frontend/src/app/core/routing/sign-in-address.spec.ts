import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { signInAddress } from './sign-in-address';

describe('signInAddress', () => {
  it.each([
    { wanted: '/posts/7?x=1', expected: '/?returnUrl=%2Fposts%2F7%3Fx%3D1' },
    { wanted: '/', expected: '/' },
    { wanted: '/?returnUrl=%2Ffriends', expected: '/?returnUrl=%2Ffriends' },
  ])('leads from $wanted to $expected', ({ wanted, expected }) => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const router = TestBed.inject(Router);

    expect(router.serializeUrl(signInAddress(router, wanted))).toBe(expected);
  });
});
