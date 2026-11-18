import { isTypedWordMatch } from './is-typed-word-match';

describe('isTypedWordMatch', () => {
  it('matches the word typed exactly', () => {
    expect(isTypedWordMatch('alice_smith', 'alice_smith')).toBe(true);
  });

  it('ignores spaces around the typed word, which a paste often brings', () => {
    expect(isTypedWordMatch('  alice_smith ', 'alice_smith')).toBe(true);
  });

  it('refuses nothing typed, part of the word, or the word in other letter case', () => {
    expect(isTypedWordMatch('', 'alice_smith')).toBe(false);
    expect(isTypedWordMatch('alice', 'alice_smith')).toBe(false);
    expect(isTypedWordMatch('Alice_Smith', 'alice_smith')).toBe(false);
  });
});
