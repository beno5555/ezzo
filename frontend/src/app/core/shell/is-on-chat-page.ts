import { Signal, computed, inject } from '@angular/core';
import { Router, isActive } from '@angular/router';
import { appAddresses } from '../routing/app-addresses';

const ignoringAllButPaths = {
  queryParams: 'ignored',
  fragment: 'ignored',
  matrixParams: 'ignored',
} as const;

// Whether the current page is the chat (/messages and /messages/:username). The chat fills the screen in
// the wide column, so that its list and its history scroll inside their own boxes and the message box
// (ticket 19) stays in view. Call it in an injection context.
export function isOnChatPage(): Signal<boolean> {
  return isActive(appAddresses.messages, inject(Router), {
    ...ignoringAllButPaths,
    paths: 'subset',
  });
}

// Whether the current page is one conversation (/messages/:username), not the list. On a phone the
// conversation takes the whole screen without the shell's bars, as in a phone's own chat apps; its back
// arrow leads to the list. Call it in an injection context.
export function isInConversation(): Signal<boolean> {
  const router = inject(Router);
  const onChat = isActive(appAddresses.messages, router, {
    ...ignoringAllButPaths,
    paths: 'subset',
  });
  const onList = isActive(appAddresses.messages, router, {
    ...ignoringAllButPaths,
    paths: 'exact',
  });

  return computed(() => onChat() && !onList());
}
