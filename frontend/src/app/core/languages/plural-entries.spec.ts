import { english } from './english';
import { georgian } from './georgian';

describe('plural entries', () => {
  it.each([
    { count: 0, text: 'Showing 0 users' },
    { count: 1, text: 'Showing 1 user' },
    { count: 2, text: 'Showing 2 users' },
    { count: 21, text: 'Showing 21 users' },
  ])('English picks the form for $count', ({ count, text }) => {
    expect(english.users.search.shown(count)).toBe(text);
  });

  it.each([
    { count: 1, text: 'ნაჩვენებია 1 მომხმარებელი' },
    { count: 5, text: 'ნაჩვენებია 5 მომხმარებელი' },
  ])('Georgian keeps the noun singular after $count', ({ count, text }) => {
    expect(georgian.users.search.shown(count)).toBe(text);
  });
});
