import { routePath } from './route-path';

describe('routePath', () => {
  it.each([
    { address: '', path: '' },
    { address: '/posts/7', path: '/posts/7' },
    { address: 'sign-in?draft=1', path: 'sign-in' },
    { address: '/register#form', path: '/register' },
    { address: '/?returnUrl=%2Ffriends#form', path: '/' },
    { address: '/users/name%3F%23%2F#details?draft=1', path: '/users/name%3F%23%2F' },
  ])('reads "$path" from "$address"', ({ address, path }) => {
    expect(routePath(address)).toBe(path);
  });
});
