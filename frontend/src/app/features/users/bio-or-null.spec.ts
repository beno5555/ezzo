import { bioOrNull } from './bio-or-null';

describe('bioOrNull', () => {
  it('keeps a bio as it was written', () => {
    expect(bioOrNull('  Hello there ')).toBe('  Hello there ');
  });

  it.each(['', '   ', '\n'])('sends %j as none', (bio) => {
    expect(bioOrNull(bio)).toBeNull();
  });
});
