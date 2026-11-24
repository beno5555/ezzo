import { canSendMessage } from './can-send-message';

describe('canSendMessage', () => {
  it.each([
    ['a short text', 'See you at six', 0],
    ['text of exactly 1000 characters', 'a'.repeat(1000), 0],
    ['a photo with no text', '', 1],
    ['five photos with only spaces as text', '   ', 5],
    ['text and photos', 'Look', 2],
  ])('lets %s be sent', (_, content, photoCount) => {
    expect(canSendMessage(content, photoCount)).toBe(true);
  });

  it.each([
    ['nothing', '', 0],
    ['only spaces and line breaks', '  \n  ', 0],
    ['text over 1000 characters', 'a'.repeat(1001), 0],
    ['text over 1000 characters with a photo', 'a'.repeat(1001), 1],
    ['six photos', 'Look', 6],
  ])('does not let %s be sent', (_, content, photoCount) => {
    expect(canSendMessage(content, photoCount)).toBe(false);
  });
});
