import { Signal, inject } from '@angular/core';
import { Router, isActive } from '@angular/router';
import { appAddresses } from '../routing/app-addresses';

// Whether the current page is the chat (/messages and /messages/:username). The chat fills the screen in
// the wide column, so that its list and its history scroll inside their own boxes and the message box
// (ticket 19) stays in view. Call it in an injection context.
export function isOnChatPage(): Signal<boolean> {
  return isActive(appAddresses.messages, inject(Router), {
    paths: 'subset',
    queryParams: 'ignored',
    fragment: 'ignored',
    matrixParams: 'ignored',
  });
}
