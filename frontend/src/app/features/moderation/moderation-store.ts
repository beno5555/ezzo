import { Injectable, inject, signal } from '@angular/core';
import { ToastStore } from '../../shared/toasts/toast-store';
import { ModerationApi } from './moderation-api';
import { ModeratedKind } from './moderated-kind';
import { ModerationStatus } from './moderation-status';

// What an administrator does to a post or a comment from its "…" menu: hide it, or make it visible again.
// The result shows at once ("Quick actions show their result at once" in the spec): the item takes its new
// state before the server has answered, and on a refusal goes back with a toast giving the reason. Each
// item ignores a second request while one is on its way, so the answers never cross.
// An administrator still receives hidden content, so a hidden item stays on the page with its badge and
// the menu's Make visible. The page's copy of the item keeps the flag it was loaded with, so every card
// and comment asks isHidden, which gives the state set here and otherwise the item's own flag.
// The state lives as long as the app and is never cleared: a reload brings the flag the server holds, which
// already agrees with it. An item that is moderated elsewhere (the admin panel, a report's decision) is the
// one case it would hide: that page must set the state here as well.
@Injectable({ providedIn: 'root' })
export class ModerationStore {
  private readonly moderationApi = inject(ModerationApi);
  private readonly toastStore = inject(ToastStore);

  // The state set here, by item (a post and a comment can share an id).
  private readonly hiddenStates = signal<ReadonlyMap<string, boolean>>(new Map());
  private readonly busyKeys = new Set<string>();

  // loadedFlag is the flag the item came with from the server.
  isHidden(kind: ModeratedKind, id: number, loadedFlag: boolean): boolean {
    return this.hiddenStates().get(keyOf(kind, id)) ?? loadedFlag;
  }

  async setHidden(kind: ModeratedKind, id: number, isHidden: boolean): Promise<void> {
    const key = keyOf(kind, id);
    const isIdle = !this.busyKeys.has(key);

    if (isIdle) {
      const before = this.hiddenStates().get(key);
      const status = isHidden ? ModerationStatus.Hidden : ModerationStatus.Visible;
      const isPost = kind === ModeratedKind.Post;

      this.busyKeys.add(key);
      this.setState(key, isHidden);
      const result = isPost
        ? await this.moderationApi.setPostStatus(id, status)
        : await this.moderationApi.setCommentStatus(id, status);
      this.busyKeys.delete(key);

      const isRefused = !result.succeeded;

      if (isRefused) {
        this.setState(key, before);
        this.toastStore.show(result.message);
      }
    }
  }

  // undefined puts the item back to the flag it came with.
  private setState(key: string, isHidden: boolean | undefined): void {
    const isCleared = isHidden === undefined;

    this.hiddenStates.update((states) => {
      const next = new Map(states);
      if (isCleared) {
        next.delete(key);
      } else {
        next.set(key, isHidden);
      }
      return next;
    });
  }
}

function keyOf(kind: ModeratedKind, id: number): string {
  return `${kind}-${id}`;
}
