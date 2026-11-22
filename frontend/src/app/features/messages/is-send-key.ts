// The message box's keys: Enter sends and Shift+Enter starts a new line, as in most chat apps. An Enter
// that ends a word an input method is composing belongs to that method, not to the box.
export function isSendKey(event: Pick<KeyboardEvent, 'key' | 'shiftKey' | 'isComposing'>): boolean {
  const isEnter = event.key === 'Enter';

  return isEnter && !event.shiftKey && !event.isComposing;
}
