import { isSendKey } from './is-send-key';

const press = (key: string, shiftKey = false, isComposing = false) => ({
  key,
  shiftKey,
  isComposing,
});

describe('isSendKey', () => {
  it('sends on Enter', () => {
    expect(isSendKey(press('Enter'))).toBe(true);
  });

  it('starts a new line on Shift+Enter', () => {
    expect(isSendKey(press('Enter', true))).toBe(false);
  });

  it('leaves the Enter that ends a word being composed to the keyboard', () => {
    expect(isSendKey(press('Enter', false, true))).toBe(false);
  });

  it('leaves every other key alone', () => {
    expect(isSendKey(press('a'))).toBe(false);
  });
});
