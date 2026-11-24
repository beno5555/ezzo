import { canSendComment } from './can-send-comment';

describe('canSendComment', () => {
  it.each([
    ['a short text', 'Looks cold!'],
    ['text with spaces around it', '  Looks cold!  '],
    ['text of exactly 500 characters', 'a'.repeat(500)],
  ])('lets %s be sent', (_, content) => {
    expect(canSendComment(content)).toBe(true);
  });

  it.each([
    ['nothing', ''],
    ['only spaces and line breaks', '  \n  '],
    ['text over 500 characters', 'a'.repeat(501)],
  ])('does not let %s be sent', (_, content) => {
    expect(canSendComment(content)).toBe(false);
  });
});
