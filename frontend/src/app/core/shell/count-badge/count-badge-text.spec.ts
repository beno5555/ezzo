import { countBadgeText } from './count-badge-text';

describe('countBadgeText', () => {
  it.each([
    { case: 'a count not read yet', count: null },
    { case: 'nothing waiting', count: 0 },
  ])('shows no badge for $case', ({ count }) => {
    expect(countBadgeText(count)).toBeNull();
  });

  it.each([
    { count: 1, shown: '1' },
    { count: 42, shown: '42' },
    { count: 99, shown: '99' },
  ])('shows $count as $shown', ({ count, shown }) => {
    expect(countBadgeText(count)).toBe(shown);
  });

  it.each([100, 250])('shows %i as 99+', (count) => {
    expect(countBadgeText(count)).toBe('99+');
  });

  it('shows 99+ for a count that may be larger than it says', () => {
    expect(countBadgeText(12, { mayBeMore: true })).toBe('99+');
  });
});
