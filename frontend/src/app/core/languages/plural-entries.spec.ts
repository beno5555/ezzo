import { english } from './english';
import { georgian } from './georgian';

describe('plural entries', () => {
  it.each([
    { count: 0, text: 'Open photo 1 of 5, 0 more photos' },
    { count: 1, text: 'Open photo 1 of 5, 1 more photo' },
    { count: 2, text: 'Open photo 1 of 5, 2 more photos' },
    { count: 21, text: 'Open photo 1 of 5, 21 more photos' },
  ])('English picks the form for $count', ({ count, text }) => {
    expect(english.shared.photos.openMoreButton(1, 5, count)).toBe(text);
  });

  it.each([
    { count: 1, text: 'ფოტო 1 / 5-ის გახსნა, კიდევ 1 ფოტო' },
    { count: 5, text: 'ფოტო 1 / 5-ის გახსნა, კიდევ 5 ფოტო' },
  ])('Georgian keeps the noun singular after $count', ({ count, text }) => {
    expect(georgian.shared.photos.openMoreButton(1, 5, count)).toBe(text);
  });
});
